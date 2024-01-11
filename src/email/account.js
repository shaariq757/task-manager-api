const brevMail = require('@getbrevo/brevo')


const apiInstance = new brevMail.TransactionalEmailsApi()

apiInstance.setApiKey(brevMail.TransactionalEmailsApiApiKeys.apiKey,process.env.BREV_MAIL_API_KEY)



const welcomeEmail = (name,email)=>{
    apiInstance.sendTransacEmail({
        sender:{'email':'shaariq725@gmail.com'},
        to:[{'name':name,'email':email}],
        subject:'Welcome email',
        textContent:`Welcome to my Task app ${name}`
    })

}

const cancelEmail = (name,email)=>{
    apiInstance.sendTransacEmail({
        sender:{'email':'shaariq725@gmail.com'},
        to:[{'name':name,'email':email}],
        subject:'User removed',
        textContent:'Your account is successfully deleted. Thank you for using my application.'
    })
}

module.exports = {
    welcomeEmail,
    cancelEmail
}