const emailValidationRegex = new RegExp(/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i);
const passwordValidationRegexp = new RegExp(/^(((?=.*[a-z])(?=.*[A-Z]))|((?=.*[a-z])(?=.*[0-9]))|((?=.*[A-Z])(?=.*[0-9])))(?=.{6,})/);

const validatePassword = (password) => {
    if (!password) {
        return "Lacking password";
    } else if (password.length < 6) {
        return "Password is too short";
    } else if (!passwordValidationRegexp.test(password)) {
        return "Invalid password";
    }
};

const validateEmail = (email) => {
    if (!email) {
        return "Lacking email";
    } else if (!emailValidationRegex.test(email)) {
        return "Invalid email"
    }
};

const validateName = (name) => {
    if (!name) {
        return "Lacking name"
    }
};

const validate = (values) => {

    let errors = {
        email: "",
        password: "",
        name: ""
    }

    const validators = {
        email: (value) => {
            errors.email = validateEmail(value)
        },
        password: (value) => {
            errors.password = validatePassword(value)
        },
        name: (value) => {
            errors.name = validateName(value)
        }
    }

    Object.keys(values).forEach(
        key => validators[key] && validators[key](values[key])
    );

    return errors;
}

module.exports = validate