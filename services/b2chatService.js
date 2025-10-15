const axios = require('axios');
const qs = require('qs');

class B2ChatService {

    constructor() {
        this.baseUrl = process.env.B2CHAT_API_BASE_URL;
    }

    async getContacts(token) {

        try {
            const params = qs.stringify({
                filters: {
                    limit: 10,
                    skip_custom_attributes: true
                }
            });
            const response = await axios.get(`${this.baseUrl}/contacts/export`, {
                params: {
                    filters: {
                        limit: 10,
                        skip_custom_attributes: true
                    }
                },
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                },
                // timeout: 10000,
            });
            return response;

        } catch (error) {
            console.log(error);
            return error;

        }
    }


}
module.exports = new B2ChatService;