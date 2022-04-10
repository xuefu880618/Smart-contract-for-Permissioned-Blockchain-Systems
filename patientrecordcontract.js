/* eslint-disable quote-props */
/* eslint-disable quotes */
/* eslint-disable linebreak-style */
/*
SPDX-License-Identifier: Apache-2.0
*/

'use strict';
const { Contract, Context } = require('fabric-contract-api');
const PatientRecord = require('./patientrecord.js');
const PatientRecordList = require('./patientrecordlist.js');


class PatientRecordContext extends Context {

    constructor() {
        super();
        this.patientRecordList = new PatientRecordList(this);
    }

}

/**
 * Define patient record smart contract by extending Fabric Contract class
 *
 */
class PatientRecordContract extends Contract {

    constructor() {
        super('edu.asu.patientrecordcontract');
    }

    /**
     * Define a custom context for commercial paper
    */
    createContext() {
        return new PatientRecordContext();
    }

    /**
     * Instantiate to perform any setup of the ledger that might be required.
     * @param {Context} ctx the transaction context
     */
    async init(ctx) {
        console.log('Instantiated the patient record smart contract.');
    }

    //  TASK-7: Implement the unknownTransaction to throw an error when
    //  a function is called that does not exist in the contract.
    //  The error message should be: 'Function name missing'.
    //  Read more about unknownTransaction here: https://hyperledger.github.io/fabric-chaincode-node/master/api/fabric-contract-api.Contract.html
    async unknownTransaction(ctx){
        // GRADED FUNCTION
        throw new Error("Function name missing")
    }

     async afterTransaction(ctx){
        console.log('---------------------INSIDE afterTransaction-----------------------')
        let func_and_params = ctx.stub.getFunctionAndParameters()
        console.log('---------------------func_and_params-----------------------')
        console.log(func_and_params)
        console.log(func_and_params['fcn'] === 'createPatientRecord' && func_and_params['params'][4]==='AB-')
        if (func_and_params['fcn'] === 'createPatientRecord' && func_and_params['params'][4]==='AB-') {
            ctx.stub.setEvent('rare-blood-type', JSON.stringify({'username': func_and_params.params[0]}))
            console.log('Chaincode event is being created!')
        }

    }
    /**
     * Create a patient record
     * @param {Context} ctx the transaction context
     * @param {String} username username
     * @param {String} name name
     * @param {String} dob date of birth
     * @param {String} gender  gender
     * @param {String} blood_type blood type
     */
    async createPatientRecord(ctx,username,name,dob,gender,blood_type){
        let precord = PatientRecord.createInstance(username,name,dob,gender,blood_type);
        //TASK 0
        // Add patient record by calling the method in the PRecordList
        await ctx.patientRecordList.addPRecord(precord);
        return precord.toBuffer();
    }

    async getPatientByKey(ctx, username, name){
        let precordKey = PatientRecord.makeKey([username,name]);
        //TASK-1: Use a method from patientRecordList to read a record by key\
        let precord = await ctx.patientRecordList.getPRecord(precordKey);
        return JSON.stringify(precord);
    }


    /**
     * Update lastCheckupDate to an existing record
     * @param {Context} ctx the transaction context
     * @param {String} username username
     * @param {String} name name
     * @param {String} lastCheckupDate date string 
     */
    async updateCheckupDate(ctx,username,name,lastCheckupDate){
        let precordKey = PatientRecord.makeKey([username,name]);
        //TASK-3: Use a method from patientRecordList to read a record by key
        //Use set_last_checkup_date from PatientRecord to update the last_checkup_date field

        let precord = await ctx.patientRecordList.getPRecord(precordKey);
        precord.setlastCheckupDate(lastCheckupDate);
        await ctx.patientRecordList.updatePRecord(precord);
        return precord.toBuffer();
    }



    /**
     * Evaluate a queryString
     * This is the helper function for making queries using a query string
     *
     * @param {Context} ctx the transaction context
     * @param {String} queryString the query string to be evaluated
    */    
   async queryWithQueryString(ctx, queryString) {

    console.log("query String");
    console.log(JSON.stringify(queryString));

    let resultsIterator = await ctx.stub.getQueryResult(queryString);

    let allResults = [];

    while (true) {
        let res = await resultsIterator.next();

        if (res.value && res.value.value.toString()) {
            let jsonRes = {};

            console.log(res.value.value.toString('utf8'));

            jsonRes.Key = res.value.key;

            try {
                jsonRes.Record = JSON.parse(res.value.value.toString('utf8'));
            } catch (err) {
                console.log(err);
                jsonRes.Record = res.value.value.toString('utf8');
            }

            allResults.push(jsonRes);
        }
        if (res.done) {
            console.log('end of data');
            await resultsIterator.close();
            console.info(allResults);
            console.log(JSON.stringify(allResults));
            return JSON.stringify(allResults);
        }
    }

}

    /**
     * Query by Gender
     *
     * @param {Context} ctx the transaction context
     * @param {String} gender gender to be queried
    */
    // Graded Function
   async queryByGender(ctx, gender) {
    //      TASK-4: Complete the query String JSON object to query using the genderIndex (META-INF folder)
    //      Construct the JSON couch DB selector queryString that uses genderIndex
    //      Pass the Query string built to queryWithQueryString
    let queryString = {
        "selector" : {
            "gender": gender
        },
        "use_index": ["_design/genderIndexDoc", "genderIndex"]
    };
    let recordsList = await this.queryWithQueryString(ctx, JSON.stringify(queryString));
    return recordsList;
 }

    /**
     * Query by Blood_Type
     *
     * @param {Context} ctx the transaction context
     * @param {String} blood_type blood_type to queried
    */
    // Graded Function
   async queryByBlood_Type(ctx, blood_type) {
    //      TASK-5: Write a new index for bloodType and write a CouchDB selector query that uses it
    //      to query by bloodType
    //      Construct the JSON couch DB selector queryString that uses blood_typeIndex
    //      Pass the Query string built to queryWithQueryString
    let query_string = {
        "selector" : {
            "blood_type": blood_type
        },
        "use_index": ["_design/blood_typeIndexDoc", "blood_typeIndex"]
    };
    let recordsList = await this.queryWithQueryString(ctx, JSON.stringify(query_string));
    return recordsList;
}

    /**
     * Query by Blood_Type Dual Query
     *
     * @param {Context} ctx the transaction context
     * @param {String} blood_type blood_type to queried
    */
    //Grade Function
   async queryByBlood_Type_Dual(ctx, blood_type1, blood_type2) {
    //      TASK-6: Write a CouchDB selector query that queries using two blood types
    //      and uses the index created for bloodType
    //      Construct the JSON couch DB selector queryString that uses two blood type indexe
    //      Pass the Query string built to queryWithQueryString
    let query_string = {
        "selector":{
        
                "$or":[
                    { "blood_type": blood_type1 },
                    { "blood_type": blood_type2 }
                ]
           
        },
        "use_index": ["_design/blood_typeIndexDoc", "blood_typeIndex"]
     };

    let blood_typeList = await this.queryWithQueryString(ctx, JSON.stringify(query_string));
    return blood_typeList;

}

}


module.exports = PatientRecordContract;
