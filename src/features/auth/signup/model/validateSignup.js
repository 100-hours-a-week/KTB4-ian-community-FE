const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_PATTERN =
  /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[!#$%&'()*+,./:;<=>?@^_`{|}~])(?=\S+$)[A-Za-z0-9!#$%&'()*+,./:;<=>?@^_`{|}~]{8,20}$/;

export function validateSignup(values) {
  const errors = {};
  const email = values.email.trim();
  const nickname = values.nickname.trim();

  if (!email) errors.email = "이메일을 입력해주세요.";
  else if (!EMAIL_PATTERN.test(email))
    errors.email = "올바른 이메일 형식이 아닙니다.";

  if (!values.password) errors.password = "비밀번호를 입력해주세요.";
  else if (!PASSWORD_PATTERN.test(values.password))
    errors.password =
      "8~20자의 대문자, 소문자, 숫자, 특수문자를 모두 포함해주세요.";

  if (!values.passwordConfirm)
    errors.passwordConfirm = "비밀번호를 한번 더 입력해주세요.";
  else if (values.password !== values.passwordConfirm)
    errors.passwordConfirm = "비밀번호가 일치하지 않습니다.";

  if (!nickname) errors.nickname = "닉네임을 입력해주세요.";
  else if (nickname.length > 10)
    errors.nickname = "닉네임은 10자 이하로 입력해주세요.";

  return errors;
}

export function isSignupValid(values) {
  return Object.keys(validateSignup(values)).length === 0;
}

export function signupPayload(values) {
  return {
    email: values.email.trim(),
    password: values.password,
    password_confirm: values.passwordConfirm,
    nickname: values.nickname.trim(),
  };
}
