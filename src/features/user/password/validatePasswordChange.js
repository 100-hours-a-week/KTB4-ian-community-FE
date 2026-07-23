const PASSWORD_PATTERN =
  /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[!#$%&'()*+,./:;<=>?@^_`{|}~])(?=\S+$)[A-Za-z0-9!#$%&'()*+,./:;<=>?@^_`{|}~]{8,20}$/;

export function validatePasswordChange(values) {
  const errors = {};
  if (!values.password) errors.password = "현재 비밀번호를 입력해주세요.";
  if (!values.newPassword) errors.newPassword = "새 비밀번호를 입력해주세요.";
  else if (!PASSWORD_PATTERN.test(values.newPassword))
    errors.newPassword =
      "8~20자의 대문자, 소문자, 숫자, 특수문자를 모두 포함해주세요.";
  else if (values.password === values.newPassword)
    errors.newPassword = "현재 비밀번호와 다른 비밀번호를 입력해주세요.";
  if (!values.newPasswordConfirm)
    errors.newPasswordConfirm = "비밀번호를 한번 더 입력해주세요.";
  else if (values.newPassword !== values.newPasswordConfirm)
    errors.newPasswordConfirm = "비밀번호가 일치하지 않습니다.";
  return errors;
}
