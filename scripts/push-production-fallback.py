import subprocess,json,urllib.request,urllib.error,base64,datetime,time
from pathlib import Path
repo=str(Path(__file__).resolve().parent.parent)
def git(*args,input=None):return subprocess.check_output(['git',*args],cwd=repo,input=input)
creds=subprocess.run(['git','credential','fill'],cwd=repo,input='protocol=https\nhost=github.com\n\n',text=True,capture_output=True,timeout=12)
fields=dict(line.split('=',1) for line in creds.stdout.splitlines() if '=' in line)
if not fields.get('password'):raise RuntimeError('Existing repository credential unavailable')
headers={'Authorization':'Bearer '+fields['password'],'User-Agent':'LearningIsFunJournalPublisher/1.0','Accept':'application/vnd.github+json','Content-Type':'application/json'}
def api(path,data=None,method=None):
 req=urllib.request.Request('https://api.github.com/repos/zumboggo/learningisfun/'+path,data=None if data is None else json.dumps(data).encode(),headers=headers,method=method)
 for attempt in range(3):
  try:return json.load(urllib.request.urlopen(req,timeout=35))
  except urllib.error.HTTPError as e:
   if e.code>=500 and attempt<2:continue
   # Never display request headers or credentials.
   raise RuntimeError('GitHub API '+path+' returned '+str(e.code)+' '+e.read().decode()[:500]) from None
remote=api('git/ref/heads/master')['object']['sha']
if subprocess.run(['git','cat-file','-e',remote],cwd=repo,capture_output=True).returncode:raise RuntimeError('Latest production commit not available locally; integrate before publishing')
if subprocess.run(['git','merge-base','--is-ancestor',remote,'HEAD'],cwd=repo).returncode:raise RuntimeError('Ref update would not be fast-forward')
commits=git('rev-list','--reverse','--topo-order',remote+'..HEAD').decode().splitlines()
print('Publishing',len(commits),'commits after',remote,flush=True)
cache=set()
for sha in commits:
 raw=git('cat-file','commit',sha).decode();head,message=raw.split('\n\n',1);lines=head.splitlines();tree=next(l[5:] for l in lines if l.startswith('tree '));parents=[l[7:] for l in lines if l.startswith('parent ')]
 def identity(prefix):
  l=next(l[len(prefix)+1:] for l in lines if l.startswith(prefix+' '));name,emailrest=l.rsplit(' <',1);email,rest=emailrest.split('> ',1);stamp,zone=rest.split();sign=1 if zone[0]=='+' else -1;tz=datetime.timezone(datetime.timedelta(minutes=sign*(int(zone[1:3])*60+int(zone[3:5]))));date=datetime.datetime.fromtimestamp(int(stamp),tz).isoformat();return {'name':name,'email':email,'date':date}
 changed=git('diff-tree','--no-commit-id','--name-status','-r','-z',parents[0],sha).split(b'\0');entries=[]
 for i in range(0,len(changed)-1,2):
  status,path=changed[i].decode(),changed[i+1].decode()
  if status=='D':entries.append({'path':path,'sha':None});continue
  record=git('ls-tree',sha,'--',path).decode().split('\t')[0].split();mode,kind,blob=record
  if kind!='blob':raise RuntimeError('Unexpected non-file object')
  if blob not in cache:
   created=api('git/blobs',{'content':base64.b64encode(git('cat-file','blob',blob)).decode(),'encoding':'base64'})
   if created['sha']!=blob:raise RuntimeError('Blob verification failed')
   cache.add(blob)
  entries.append({'path':path,'mode':mode,'type':kind,'sha':blob})
 parentTree=git('rev-parse',parents[0]+'^{tree}').decode().strip()
 generatedTree=api('git/trees',{'base_tree':parentTree,'tree':entries}) if entries else {'sha':parentTree}
 if generatedTree['sha']!=tree:raise RuntimeError('Tree verification failed for '+sha)
 payload={'message':message,'tree':tree,'parents':parents,'author':identity('author'),'committer':identity('committer')}
 created=api('git/commits',payload)
 if created['sha']!=sha:raise RuntimeError('Commit verification failed: expected '+sha+', received '+created['sha'])
 print('Verified commit',sha[:12],flush=True)
head=git('rev-parse','HEAD').decode().strip()
current=api('git/ref/heads/master')['object']['sha']
if current!=remote and current!=head:raise RuntimeError('Production moved during publication; integrate first')
result=api('git/refs/heads/master',{'sha':head,'force':False},method='PATCH')
if result['object']['sha']!=head:raise RuntimeError('Publication not confirmed')
git('update-ref','refs/remotes/origin/master',head)
Path(repo+'/.episode-git-publication.json').write_text(json.dumps({'head':head,'prior':remote,'commits':commits,'method':'GitHub Git Data API; force=false; each blob, tree, and commit SHA verified','verifiedAt':datetime.datetime.now(datetime.timezone.utc).isoformat()},indent=2))
print('Published exact local HEAD to master:',head,flush=True)
