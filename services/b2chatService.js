const axios = require('axios');

class B2ChatService {

    constructor() {
        this.baseUrl = process.env.B2CHAT_URL;
    }

    async getContacts(token) {

    }


}
module.exports = new B2ChatService;