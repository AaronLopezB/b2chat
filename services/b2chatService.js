const axios = require('axios');
const qs = require('qs');

class B2ChatService {

    constructor() {
        this.baseUrl = process.env.B2CHAT_API_BASE_URL;
    }

    // Validate token
    async validateToken(token) {
        try {
            if (!token) return { ok: false, error: 'Missing token' };
            const params = new URLSearchParams({
                limit: 1,
                offset: 1
            });
            const response = await fetch(`${this.baseUrl}/contacts/export?${params}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                // params: JSON.stringify(params)
            });
            if (!response.ok) {
                const responseText = await response.json();
                return {
                    ok: false,
                    error: responseText
                };
            }
            const data = await response.json();
            return { ok: true, data: data };
            // return { ok: true, data: response.data };
        } catch (error) {
            const errPayload = error?.response?.data ?? error?.message ?? error;
            console.log({ method: 'validateToken', error: errPayload });
            return { ok: false, error: errPayload };
        }
    }

    // Get contacts
    async getContacts(token, filters = {}) {
        try {
            if (!token) return { ok: false, error: 'Missing token' };

            const {
                from = '',
                to = '',
                filter = 'name',
                search = '',
                limit = 10,
                // offset = 1,
                order_dir = 'desc',
                skip_custom_attributes = false,
                skip_tags = false
            } = filters;

            const payload = {
                filters: {
                    limit,
                    // offset,
                    create: { from, to },
                    order_dir,
                    skip_custom_attributes,
                    skip_tags,
                    contact_lookup: [
                        { field: filter, value: search }
                    ]
                }
            };

            const response = await axios.get(`${this.baseUrl}/contacts/export`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                timeout: 10000, // opcional: tiempo de espera en ms
                data: JSON.stringify(payload)
            });

            console.log(response);

            return { ok: true, data: response.data };
        } catch (error) {
            const errPayload = error?.response?.data ?? error?.message ?? error;
            console.log({ method: 'getContactsService', error: errPayload });
            return { ok: false, error: errPayload };
        }
    }

    // Create contact
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
                // console.log(response);
                const responseText = await response.json();
                return {
                    ok: false,
                    error: responseText
                };
                // throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            return { ok: true, message: 'Contact created successfully', data: data };
        } catch (error) {
            console.log({ 'method': 'createContactService', 'error': error });
            return error;
        }
    }

    // Update contact
    async updateContact(token, id, contactData) {
        try {
            let params = {
                skip_required_custom_attributes: true,
                contact: {
                    ...contactData
                }
            }

            const response = await axios.patch(`${this.baseUrl}/contacts/${id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                data: JSON.stringify(params)
            });
            console.log(response);

            // const response = await fetch(`${this.baseUrl}/contacts/${id}`, {
            //     method: 'PATCH',
            //     headers: {
            //         'Authorization': `Bearer ${token}`,
            //         'Content-Type': 'application/json',
            //     },
            //     body: JSON.stringify(params)
            // });

            // if (!response.ok) {
            //     const responseText = await response.json();
            //     console.log({
            //         'responseText': responseText, 'responseStatus': response.status, 'path': `${this.baseUrl}/contacts/${id}`
            //     });

            //     return {
            //         ok: false,
            //         error: responseText ?? `HTTP error! status: ${response.status}`
            //     };
            // }


            // const data = await response.json();
            // console.log({ resolve: "response", data: data });

            // return data;
        } catch (error) {
            console.log({ 'method': 'updateContactService', 'error': error });
            return error;
        }
    }

    // Tags
    async createTag(token, tagData) {
        try {


            // const response = await axios.post(`${this.baseUrl}/contacts/${tagData.contact_id}/tags?tag_actions=ASSIGN_TAG`, tagData.tags, {
            //     headers: {
            //         'Authorization': `Bearer ${token}`,
            //         'Content-Type': 'application/json',
            //     },
            //     params: JSON.stringify(tagData.tags)
            // });

            // console.log(response);
            // return { ok: true, message: 'Tag created successfully', data: response.data };


            const response = await fetch(`${this.baseUrl}/contacts/${tagData.contact_id}/tags?tag_actions=ASSIGN_TAG`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(tagData.tags)
            });

            if (!response.ok) {
                const statusCode = response.status;
                return {
                    ok: false,
                    status: statusCode,
                };
            }
            return { ok: true, status: response.status };
            // console.log({ response, 'method': 'createTagService' });

            // const data = await response.json();
            // return { ok: true, message: 'Tag created successfully', data: data };
            // console.log({ resolve: "response", data: data });

        } catch (error) {
            console.log({ 'method': 'createTagService', 'error': error });
            return error;
        }
    }

    // Delete tag
    async deleteTag(token, tagData) {
        try {
            // const tagNames = tagData.tags.map(tag => tag.name).join(','); // Convierte el arreglo de objetos en una cadena separada por comas

            // const response = await axios.delete(`${this.baseUrl}/contacts/${tagData.contact_id}/tags`, {
            //     headers: {
            //         'Authorization': `Bearer ${token}`,
            //         'Content-Type': 'application/json',
            //     },
            //     params: JSON.stringify(tagData.tags)
            // });

            const response = await fetch(`${this.baseUrl}/contacts/${tagData.contact_id}/tags`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(tagData.tags)
            });
            if (!response.ok) {
                // let responseBody;
                // try {
                //     responseBody = await response.json();
                // } catch (e) {
                //     responseBody = await response.text();
                // }
                const statusCode = response.status;
                return {
                    ok: false,
                    status: statusCode,
                    // error: responseBody
                };
            }

            return { ok: true, message: 'Tag deleted successfully', status: response.status };

        } catch (error) {
            console.log(error);
            return error;
        }
    }

    // Get chats
    async getChats(token, filters = {}) {
        try {
            const params = {
                // ...filters,
                contact_lookup: filters.contact_lookup,
                // messaging_type: filters.messaging_type,
                date_range: filters.date_range,
                // agent_lookup: filters.agent_lookup ? filters.agent_lookup : '',
                email_recipient: filters.email_recipient,
                limit: 120,
                offset: 100
            };
            if (filters.agent_lookup !== '' && filters.agent_lookup !== null) {
                params.agent_lookup = filters.agent_lookup;
            }

            const response = await fetch(`${this.baseUrl}/chats/export`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                params: JSON.stringify(params)
            });

            const data = await response.json();

            return {
                ok: true,
                data: data
            };
        } catch (error) {
            // console.log({ 'method': 'getChats', 'error': error });
            return error;
        }
    }

    async sendMessage(token, messageData) {
        try {
            const response = await fetch(`${this.baseUrl}/broadcast`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(messageData)
            });

            if (!response.ok) {
                const errorData = response.status;
                console.log('Error en sendMessage:', errorData);
                return {
                    ok: false,
                    error: errorData
                };
            }

            const data = await response.json();
            // console.log(data, response, messageData);

            return {
                ok: true,
                data: data
            };
        } catch (error) {
            console.log({ 'method': 'sendMessage', 'error': error });
            return error;
        }
    }

}



module.exports = new B2ChatService;