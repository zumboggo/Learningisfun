import '@testing-library/jest-dom';

// jsdom does not yet implement the browser's native dialog methods.
if(!HTMLDialogElement.prototype.showModal){
 HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','');this.querySelector<HTMLElement>('button,input,textarea,a')?.focus();};
 HTMLDialogElement.prototype.close=function(){this.removeAttribute('open');};
}
