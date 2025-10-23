const axios = require('axios');
const qs = require('qs');
const config = require('../config/app');
const { response } = require('express');

class B2ChatService {

    constructor() {
        this.baseUrl = config.b2Chat.baseUrl;

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
                skip_custom_attributes = true,
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
            return { ok: false, error: error };
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

            // const response = await axios.patch(`${this.baseUrl}/contacts/${id}`, {
            //     headers: {
            //         'Authorization': `Bearer ${token}`,
            //         'Content-Type': 'application/json',
            //     },
            //     data: JSON.stringify(params)
            // });

            // console.log(response);

            const response = await fetch(`${this.baseUrl}/contacts/${id}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(params)
            });

            if (!response.ok) {
                const responseText = await response.json();
                console.log({
                    'responseText': responseText, 'responseStatus': response.status, 'path': `${this.baseUrl}/contacts/${id}`
                });

                return {
                    ok: false,
                    error: responseText.message == '' ? responseText.error : responseText.message,
                    code: response.status
                };
            }


            const data = await response.json();
            // console.log({ resolve: "response", data: data });

            return { ok: true, data: data };
        } catch (error) {
            // console.log({ 'method': 'updateContactService', 'error': error });
            return {
                ok: false,
                error: error
            };
        }
    }

    // Tags
    async createTag(token, tagData) {
        try {

            // 2 values: SKIP_TAGS, ASSIGN_TAG
            /**
             * tag_actions: "SKIP_TAGS"
             *   - description: "Cuando un tag no es encontrado o no está en estado ACTIVO se ignora y no se asocia el tag al contacto."
             *   - example: "SKIP_TAGS"
             *  tag_actions: "ASSIGN_TAG"
             *   - description: "Si un tag no es encontrado se crea el tag y se asocia el tag al contacto, en caso de estár inactivo solo se debe asociar al contacto."
             *   - example: "ASSIGN_TAG"
             */

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
                const responseText = await response.json();
                console.log({
                    'responseText': responseText, 'responseStatus': response.status, 'path': `${this.baseUrl}/contacts/${tagData.contact_id}/tags`
                });
                return {
                    ok: false,
                    status: statusCode,
                    message: responseText
                };
            }
            // const data = await response.json();
            return { ok: true, status: response.status, message: 'Tag created successfully' };

        } catch (error) {
            console.log({ 'method': 'createTagService', 'error': error });
            return {
                ok: false,
                message: error,
                status: 500
            };
        }
    }

    // Delete tag
    async deleteTag(token, tagData) {
        try {

            const response = await fetch(`${this.baseUrl}/contacts/${tagData.contact_id}/tags`, {
                method: 'DELETE',
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
                    message: 'Error deleting tag',
                    status: statusCode,
                };
            }

            return { ok: true, message: 'Tag deleted successfully', status: response.status };

        } catch (error) {

            return {
                ok: false,
                message: error,
                status: 500
            };
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
                offset: 0
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

            if (!response.ok) {
                const status = response.status;
                const responseText = await response.json();
                return {
                    ok: false,
                    // message: 'Error getting chats',
                    status: status,
                    data: responseText
                }
            }

            const data = await response.json();

            return {
                ok: true,
                data: data,
                status: response.status
            };
        } catch (error) {
            // console.log({ 'method': 'getChats', 'error': error });
            return {
                ok: false,
                message: error,
                status: 500
            };
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
                const statusCode = await response.json();

                const errorData = response.status;

                return {
                    ok: false,
                    response: statusCode,
                    message: "Error sending Message",
                    code: errorData
                };
            }

            const data = await response.json();

            return {
                ok: true,
                response: data,
                code: response.status,
                message: "Message sent successfully"
            };
        } catch (error) {
            // console.log({ 'method': 'service send message error', 'error': error });
            return {
                ok: false,
                message: "Error sending Message",
                response: error,
                code: 500
            };
        }
    }

    async sendMessageV2(token, messageData) {
        try {

            const response = await fetch(`${this.baseUrl}/v2/broadcast`, {
                method: 'POST',
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(messageData)
            });

            if (!response.ok) {
                const statusCode = await response.json();

                const errorData = response.status;

                return {
                    ok: false,
                    response: statusCode,
                    message: "Error sending Message",
                    code: errorData
                };
            }

            const data = await response.json();

            return {
                ok: true,
                response: data,
                code: response.status,
                message: "Message sent successfully"
            };
        } catch (error) {
            return {
                ok: false,
                message: "Error sending Message",
                response: error,
                code: 500
            };
        }
    }

}



module.exports = new B2ChatService;