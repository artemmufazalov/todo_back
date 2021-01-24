const createConfirmationEmail = (emailFrom, emailTo, userName, hash) => {

    return {
        from: emailFrom,
        to: emailTo,
        subject: "Подтверждение почты для регистрации в приложении ToDo App",
        html: `<p>Уважаемый пользователь,</p>
                    <p>Вы получили данное сообщение, потому что ваш email был использован при регистрации на сайте
                        <a href="${process.env.FRONTEND_ORIGIN}">ToDo App</a></p>
                    <p>Для того, чтобы подтвердить почту, использованную при регистрации, перейдите
                        <a href="${process.env.FRONTEND_ORIGIN}/register/verify/submit?hash=${hash}">по этой ссылке</a>.
                    </p>
                    <p>Если вы не регистрировались 
                        <a href="${process.env.FRONTEND_ORIGIN}">на сайте </a>,
                    или это письмо пришло вам по ошибке, перейдите 
                        <a href="${process.env.FRONTEND_ORIGIN}/register/verify/reject?hash=${hash}">по этой ссылке</a>.
                    </p>
                    <p>С уважением,<br/>
                    Команда ToDo App
                    </p>`
    }

}

const createPasswordResetEmail = (emailFrom, emailTo, userName, hash) => {

    return {
        from: emailFrom,
        to: emailTo,
        subject: "Смена пароля в приложении ToDo App",
        html: `<p>Уважаемый пользователь,</p>
                    <p>Вы получили данное сообщение, потому что запросили смену пароля в приложении
                        <a href="${process.env.FRONTEND_ORIGIN}">ToDo app</a>.</p>
                    <p>Для того, чтобы сменить пароль, перейдите  
                        <a href="${process.env.FRONTEND_ORIGIN}/password/change/?hash=${hash}">по этой ссылке</a>.
                    </p>
                    <p>Если вы не запрашивали смену пароля, проигнорируйте данное письмо.</p>
                    <p>С уважением,<br/>
                    Команда ToDo App
                    </p>`
    }

}

module.exports = {createConfirmationEmail, createPasswordResetEmail}