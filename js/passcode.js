export function getPasscode() {
  return localStorage.getItem('wetinPasscode');
}

export function setPasscode(passcode) {
  localStorage.setItem('wetinPasscode', passcode);
}

export function removePasscode() {
  localStorage.removeItem('wetinPasscode');
}

export function showSetPasscodeScreen() {
  document.getElementById('setPasscodeScreen').style.display = 'block';
  document.getElementById('lockScreen').style.display = 'none';
  document.getElementById('mainContent').style.display = 'none';
  document.body.classList.remove('unlocked');
}

export function showLockScreen() {
  document.getElementById('setPasscodeScreen').style.display = 'none';
  document.getElementById('lockScreen').style.display = 'block';
  document.getElementById('mainContent').style.display = 'none';
  document.body.classList.remove('unlocked');
}

export function showMainContent(displayEntries, resetIdleTimer) {
  document.getElementById('setPasscodeScreen').style.display = 'none';
  document.getElementById('lockScreen').style.display = 'none';
  document.getElementById('mainContent').style.display = 'block';
  document.body.classList.add('unlocked');
  if (displayEntries) displayEntries();
  if (resetIdleTimer) resetIdleTimer();
}

export function initPasscodeFeature(lockJournal, unlockJournal) {
  const setPasscodeBtn = document.getElementById('setPasscodeBtn');
  const newPasscode = document.getElementById('newPasscode');
  const confirmPasscode = document.getElementById('confirmPasscode');
  const setPasscodeError = document.getElementById('setPasscodeError');
  const unlockBtn = document.getElementById('unlockBtn');
  const passcodeInput = document.getElementById('passcodeInput');
  const passcodeError = document.getElementById('passcodeError');
  const lockNowBtn = document.getElementById('lockNowBtn');
  const forgotPasscodeBtn = document.getElementById('forgotPasscode');
  const forgotPasscodeModal = document.getElementById('forgotPasscodeModal');
  const resetPasscodeBtn = document.getElementById('resetPasscodeBtn');
  const rememberPasscodeBtn = document.getElementById('rememberPasscodeBtn');

  setPasscodeBtn.onclick = () => {
    if (newPasscode.value === '' || confirmPasscode.value === '') {
      setPasscodeError.textContent = 'alaye add passcode na!🙄';
      setPasscodeError.style.display = 'block';
      return;
    }
    if (newPasscode.value !== confirmPasscode.value) {
      setPasscodeError.textContent = 'Passcodes no match! 😐';
      setPasscodeError.style.display = 'block';
      return;
    }
    setPasscode(newPasscode.value);
    setPasscodeError.style.display = 'none';
    showLockScreen();
  };

  unlockBtn.onclick = () => {
    if (passcodeInput.value === getPasscode()) {
      passcodeError.style.display = 'none';
      unlockJournal();
    } else {
      passcodeError.style.display = 'block';
    }
  };

  lockNowBtn.onclick = lockJournal;

  forgotPasscodeBtn.onclick = () => {
    forgotPasscodeModal.style.display = 'flex';
  };

  resetPasscodeBtn.onclick = () => {
    removePasscode();
    localStorage.removeItem('wetinEntries');
    forgotPasscodeModal.style.display = 'none';
    showSetPasscodeScreen();
  };

  rememberPasscodeBtn.onclick = () => {
    forgotPasscodeModal.style.display = 'none';
  };
}