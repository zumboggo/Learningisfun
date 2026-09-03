import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

const navigate = vi.fn();
const login = vi.fn();
const register = vi.fn();
const joinClass = vi.fn();
const findClassByJoinCode = vi.fn();
const findClassByParentCode = vi.fn();
const findClassBySubstituteCode = vi.fn();

let currentUser: { $id: string; name: string; role?: string } | null = null;

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => navigate };
});

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: currentUser, loading: false, login, register }),
}));

vi.mock('@/services/class.service', () => ({
  joinClass: (...args: unknown[]) => joinClass(...args),
  findClassByJoinCode: (...args: unknown[]) => findClassByJoinCode(...args),
  findClassByParentCode: (...args: unknown[]) => findClassByParentCode(...args),
  findClassBySubstituteCode: (...args: unknown[]) => findClassBySubstituteCode(...args),
}));

async function renderPage(path = '/join/ABC123') {
  const { JoinClassPage } = await import('@/pages/JoinClassPage');
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/join" element={<JoinClassPage />} />
        <Route path="/join/:code" element={<JoinClassPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('JoinClassPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentUser = null;
    findClassByJoinCode.mockResolvedValue({
      $id: 'class-1',
      name: 'Period 3',
      courseName: 'English 10',
    });
    findClassByParentCode.mockResolvedValue(null);
    findClassBySubstituteCode.mockResolvedValue(null);
    register.mockResolvedValue({ $id: 'student-1', name: 'Sam' });
    login.mockResolvedValue({ $id: 'student-2', name: 'Alex' });
    joinClass.mockResolvedValue({ $id: 'class-1' });
  });

  it('prefills the code from the URL and previews the class', async () => {
    await renderPage();
    expect(screen.getByLabelText('Student class code')).toHaveValue('ABC123');
    await waitFor(() => expect(screen.getByText('English 10')).toBeInTheDocument());
  });

  it('accepts the code from a query string too', async () => {
    await renderPage('/join?code=xyz789');
    expect(screen.getByLabelText('Student class code')).toHaveValue('XYZ789');
  });

  it('creates an account and enrols in one submit', async () => {
    const user = userEvent.setup();
    await renderPage();

    await user.type(screen.getByLabelText('Nickname'), 'Sam');
    await user.type(screen.getByLabelText('Email'), 'sam@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Create account & join' }));

    await waitFor(() => expect(register).toHaveBeenCalledWith('sam@example.com', 'password123', 'Sam', 'student'));
    expect(joinClass).toHaveBeenCalledWith('student-1', 'ABC123', 'student');
    expect(navigate).toHaveBeenCalledWith('/dashboard', { replace: true });
  });

  it('signs an existing student in and enrols them', async () => {
    const user = userEvent.setup();
    await renderPage();

    await user.click(screen.getByRole('button', { name: 'I have an account' }));
    await user.type(screen.getByLabelText('Email'), 'alex@example.com');
    await user.type(screen.getByLabelText('Password'), 'hunter2');
    await user.click(screen.getByRole('button', { name: 'Sign in & join' }));

    await waitFor(() => expect(login).toHaveBeenCalledWith('alex@example.com', 'hunter2'));
    expect(register).not.toHaveBeenCalled();
    expect(joinClass).toHaveBeenCalledWith('student-2', 'ABC123', 'student');
  });

  it('keeps the student on the page when the code is rejected', async () => {
    joinClass.mockResolvedValue(null);
    const user = userEvent.setup();
    await renderPage();

    await user.type(screen.getByLabelText('Nickname'), 'Sam');
    await user.type(screen.getByLabelText('Email'), 'sam@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Create account & join' }));

    await waitFor(
      () => expect(screen.getByText(/didn't match a class/)).toBeInTheDocument(),
      { timeout: 3000 },
    );
    // The first lookup can beat the new session into place, so it is retried
    // once before the code is called bad.
    expect(joinClass).toHaveBeenCalledTimes(2);
    expect(navigate).not.toHaveBeenCalled();
  });

  it('enrols on the first try without a retry when the code is good', async () => {
    joinClass.mockResolvedValue({ $id: 'class-1' });
    const user = userEvent.setup();
    await renderPage();

    await user.type(screen.getByLabelText('Nickname'), 'Sam');
    await user.type(screen.getByLabelText('Email'), 'sam@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Create account & join' }));

    await waitFor(() => expect(navigate).toHaveBeenCalledWith('/dashboard', { replace: true }));
    expect(joinClass).toHaveBeenCalledTimes(1);
  });

  it('rejects a short password before calling the backend', async () => {
    const user = userEvent.setup();
    await renderPage();

    await user.type(screen.getByLabelText('Nickname'), 'Sam');
    await user.type(screen.getByLabelText('Email'), 'sam@example.com');
    await user.type(screen.getByLabelText('Password'), 'short');
    await user.click(screen.getByRole('button', { name: 'Create account & join' }));

    expect(await screen.findByText('Password must be at least 8 characters')).toBeInTheDocument();
    expect(register).not.toHaveBeenCalled();
  });

  it('asks for a code when the link carries none', async () => {
    const user = userEvent.setup();
    await renderPage('/join');

    await user.type(screen.getByLabelText('Nickname'), 'Sam');
    await user.type(screen.getByLabelText('Email'), 'sam@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Create account & join' }));

    expect(await screen.findByText(/Enter the 6-character class code/)).toBeInTheDocument();
    expect(register).not.toHaveBeenCalled();
  });

  it('warns when the code matches no class', async () => {
    findClassByJoinCode.mockResolvedValue(null);
    await renderPage();
    expect(await screen.findByText(/couldn't preview that student code/)).toBeInTheDocument();
  });

  it('offers a one-click join to a student who is already signed in', async () => {
    currentUser = { $id: 'student-3', name: 'Jo' };
    const user = userEvent.setup();
    await renderPage();

    expect(screen.getByText('Jo')).toBeInTheDocument();
    expect(screen.queryByLabelText('Nickname')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Join class' }));

    await waitFor(() => expect(joinClass).toHaveBeenCalledWith('student-3', 'ABC123', 'student'));
    expect(navigate).toHaveBeenCalledWith('/dashboard', { replace: true });
  });

  it('creates a read-only parent account when a parent code is used', async () => {
    findClassByParentCode.mockResolvedValue({ $id:'class-1',name:'Period 3',courseName:'English 10' });
    const user=userEvent.setup(); await renderPage();
    await user.click(screen.getByRole('button',{name:'Parent observer'}));
    expect(await screen.findByText(/Joining .* as a parent observer/)).toBeInTheDocument();
    expect(screen.getByLabelText('Parent code')).toHaveValue('ABC123');
    await user.type(screen.getByLabelText('Nickname'),'Pat'); await user.type(screen.getByLabelText('Email'),'pat@example.com'); await user.type(screen.getByLabelText('Password'),'password123'); await user.click(screen.getByRole('button',{name:'Create account & join'}));
    await waitFor(()=>expect(register).toHaveBeenCalledWith('pat@example.com','password123','Pat','parent'));
    expect(joinClass).toHaveBeenCalledWith('student-1','ABC123','parent');
  });

  it('creates a temporary substitute account when a substitute code is used', async () => {
    findClassBySubstituteCode.mockResolvedValue({ $id:'class-1',name:'Period 3',courseName:'English 10' });
    const user=userEvent.setup(); await renderPage();
    await user.click(screen.getByRole('button',{name:'Substitute'}));
    expect(await screen.findByText(/temporary substitute/)).toBeInTheDocument();
    await user.type(screen.getByLabelText('Nickname'),'Ms Lee'); await user.type(screen.getByLabelText('Email'),'lee@example.com'); await user.type(screen.getByLabelText('Password'),'password123'); await user.click(screen.getByRole('button',{name:'Create account & join'}));
    await waitFor(()=>expect(register).toHaveBeenCalledWith('lee@example.com','password123','Ms Lee','substitute'));
    expect(joinClass).toHaveBeenCalledWith('student-1','ABC123','substitute');
  });
});
