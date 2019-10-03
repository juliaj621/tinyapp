const getUserByEmail = function(email, database) {
  for (let key in database) {
    let user = database[key];
    if (user.email === email) {
      return user;
    }
  }
};

const generateRandomString =  function() {
  let string = Math.random().toString(36).slice(-6);
  return string;
};

module.exports = { getUserByEmail, generateRandomString };