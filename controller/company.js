const { response } = require("express");
const Company = require("../models/company");

const getAllCompanies = async (req, res = response) => {
    try {
        const { limit = 5, from = 0 } = req.query;
        const query = { state: true };

        const [total, companies] = await Promise.all([
            Company.countDocuments(query),
            Company.find(query)
                .skip(Number(from))
                .limit(Number(limit))
        ]);

        res.status(200).json({
            ok: true,
            total,
            companies
        })

    } catch (error) {
        console.log(error);
        res.status(500).json({
            ok: false,
            msj: `error to get companies, talk to the admin: ${error}`
        })
    }
}

const createCompany = async (req, res = response) => {
    try {
        const { name, state } = req.body;
        const company = new Company({ name, state });
        await company.save();
        res.status(200).json({
            ok: true,
            msj: 'company created',
            company
        })
    } catch (error) {
        console.log(error);
        res.status(500).json({
            ok: false,
            msj: `error to create company, talk to the admin: ${error}`
        })
    }
}

module.exports = {
    getAllCompanies,
    createCompany
}