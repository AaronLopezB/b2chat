const axios = require('axios');
const qs = require('qs');

class B2ChatService {

    constructor() {
        this.baseUrl = process.env.B2CHAT_API_BASE_URL;
    }

    async getContacts(token) {
        try {
            const params = new URLSearchParams({
                limit: 500,
                order_dir: "desc"
            });
            const request = await fetch(`${this.baseUrl}/contacts/export?${params}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!request.ok) {
                throw new Error(`HTTP error! status: ${request.status}`);
            }
            const data = await request.json();

            return data;


        } catch (error) {
            console.log({ 'method': 'getContactsService', 'error': error });
            return error;
        }
    }

    async createContact(token, contactData) {
        try {
            // console.log({
            //     method: 'createContact',
            //     token,
            //     contactData
            // });

            const params = {
                skip_required_custom_attributes: true,
                contact: {
                    ...contactData
                }
            }
            const response = await fetch(`${this.baseUrl}/contacts/import`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(params)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            // console.log({
            //     method: 'createContact',
            //     dataEndpoint: data.message
            // });
            return data;
        } catch (error) {
            console.log({ 'method': 'createContactService', 'error': error });
            return error;
        }
    }

    async updateContact(token, id, contactData) {
        try {
            const params = {
                skip_required_custom_attributes: true,
                contact: {
                    ...contactData
                }
            }
            const response = await fetch(`${this.baseUrl}/contacts/${id}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(params)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.log({ 'method': 'updateContactService', 'error': error });
            return error;
        }
    }
}


module.exports = new B2ChatService;