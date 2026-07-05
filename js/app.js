const CONTACT_EMAIL = 'gobyjea@gmail.com';
const LS_CONTACTS = 'ppreu_contact_inquiries';
const LS_SIGNUPS = 'ppreu_alert_signups';
const CONTACT_SUCCESS_MESSAGE =
  '문의가 등록되었습니다. 답변까지 1~2일 소요될 수 있습니다.';

function createId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return String(Date.now()) + Math.random().toString(16).slice(2);
}

function normalizePhone(phone) {
  return String(phone || '').replace(/\D/g, '');
}

function saveLocalSignup(payload) {
  const list = JSON.parse(localStorage.getItem(LS_SIGNUPS) || '[]');
  list.unshift({ id: createId(), ...payload, created_at: new Date().toISOString() });
  localStorage.setItem(LS_SIGNUPS, JSON.stringify(list.slice(0, 200)));
}

function saveLocalInquiry(payload) {
  const list = JSON.parse(localStorage.getItem(LS_CONTACTS) || '[]');
  list.unshift({ id: createId(), ...payload, created_at: new Date().toISOString() });
  localStorage.setItem(LS_CONTACTS, JSON.stringify(list.slice(0, 100)));
}

async function submitToFormSubmit(fields) {
  const res = await fetch(
    'https://formsubmit.co/ajax/' + encodeURIComponent(CONTACT_EMAIL),
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(fields),
    }
  );

  let data = {};
  try {
    data = await res.json();
  } catch {
    /* ignore */
  }

  const failed = !res.ok || data.success === 'false' || data.success === false;
  if (failed) {
    throw new Error(data.message || '전송에 실패했습니다. 잠시 후 다시 시도해 주세요.');
  }

  return true;
}

async function submitSignupPhone(options) {
  const phone = options.phone;
  const store = options.store || '소금도화 천안 불당점';
  const digits = normalizePhone(phone);

  if (digits.length < 10 || digits.length > 11) {
    throw new Error('올바른 전화번호를 입력해 주세요.');
  }

  const formattedPhone = digits.length === 11
    ? digits.slice(0, 3) + '-' + digits.slice(3, 7) + '-' + digits.slice(7)
    : digits.slice(0, 3) + '-' + digits.slice(3, 6) + '-' + digits.slice(6);

  const payload = { phone: formattedPhone, store: store };

  await submitToFormSubmit({
    _subject: '[뿌쁘] 알림 신청 - ' + formattedPhone,
    _template: 'table',
    _captcha: 'false',
    phone: formattedPhone,
    store: store,
    message: '알림 신청 전화번호: ' + formattedPhone + '\n매장: ' + store,
  });

  saveLocalSignup(Object.assign({}, payload, { sent: true }));
  return true;
}

async function submitContactInquiry(fields) {
  const trimmedName = fields.name.trim();
  const trimmedEmail = fields.email.trim();
  const trimmedSubject = fields.subject.trim();
  const trimmedMessage = fields.message.trim();

  if (trimmedName.length < 2) throw new Error('이름은 2자 이상 입력해 주세요.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
    throw new Error('올바른 이메일 주소를 입력해 주세요.');
  }
  if (trimmedSubject.length < 2) throw new Error('제목은 2자 이상 입력해 주세요.');
  if (trimmedMessage.length < 10) throw new Error('문의 내용은 10자 이상 입력해 주세요.');

  const payload = {
    name: trimmedName,
    email: trimmedEmail,
    subject: trimmedSubject,
    message: trimmedMessage,
  };

  await submitToFormSubmit({
    name: trimmedName,
    email: trimmedEmail,
    _replyto: trimmedEmail,
    _subject: '[뿌쁘] ' + trimmedSubject,
    subject: trimmedSubject,
    message: trimmedMessage,
    _template: 'table',
    _captcha: 'false',
  });

  saveLocalInquiry(Object.assign({}, payload, { sent: true }));
  return true;
}

document.addEventListener('DOMContentLoaded', function () {
  const signupForm = document.getElementById('signup-form');
  const inquiryModal = document.getElementById('inquiry-modal');
  const inquiryForm = document.getElementById('inquiry-form');
  const toast = document.getElementById('toast');

  function showToast(message, isError) {
    toast.textContent = message;
    toast.className = 'toast show' + (isError ? ' error' : '');
    clearTimeout(showToast._timer);
    showToast._timer = setTimeout(function () {
      toast.classList.remove('show');
    }, isError ? 5000 : 4000);
  }

  function openInquiryModal() {
    inquiryModal.classList.add('open');
    inquiryModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    document.getElementById('inquiry-name').focus();
  }

  function closeInquiryModal() {
    inquiryModal.classList.remove('open');
    inquiryModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    inquiryForm.reset();
  }

  signupForm.addEventListener('submit', async function (event) {
    event.preventDefault();

    const submitBtn = signupForm.querySelector('button[type="submit"]');
    const successMessage = document.getElementById('success-message');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = '신청 중…';
    submitBtn.disabled = true;
    successMessage.classList.remove('show');

    try {
      await submitSignupPhone({
        phone: signupForm.phone.value,
        store: '소금도화 천안 불당점',
      });
      successMessage.classList.add('show');
      signupForm.phone.value = '';
    } catch (err) {
      showToast(err.message, true);
    } finally {
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
    }
  });

  document.getElementById('inquiry-open-btn').addEventListener('click', openInquiryModal);
  document.getElementById('inquiry-close-btn').addEventListener('click', closeInquiryModal);

  inquiryModal.addEventListener('click', function (event) {
    if (event.target === inquiryModal) closeInquiryModal();
  });

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && inquiryModal.classList.contains('open')) {
      closeInquiryModal();
    }
  });

  inquiryForm.addEventListener('submit', async function (event) {
    event.preventDefault();

    const submitBtn = inquiryForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = '등록 중…';
    submitBtn.disabled = true;

    try {
      await submitContactInquiry({
        name: inquiryForm.name.value,
        email: inquiryForm.email.value,
        subject: inquiryForm.subject.value,
        message: inquiryForm.message.value,
      });
      closeInquiryModal();
      showToast(CONTACT_SUCCESS_MESSAGE);
    } catch (err) {
      showToast(err.message, true);
    } finally {
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
    }
  });
});
