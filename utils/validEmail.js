function validateEmail(value) {
  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
  let isValid = value.match(emailRegex);

  if (isValid) {
    return true;
  }
}

module.exports = { validateEmail };
