import { MongoClient,ServerApiVersion,ObjectId } from "mongodb";
import 'dotenv/config';

const dbURI = `mongodb://${process.env.DB_USR}:${process.env.DB_PWD}@${process.env.DB_HST}:${process.env.DB_PORT}/${process.env.DB_NAM}`
//const dbURILocal = "mongodb://localhost:27017/igs_sv";
//mongodb://[username:password@]host[:port][,...hostN[:port]][/[database][?options]]
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(dbURI,  {
        serverApi: {
            version: ServerApiVersion.v1,
            strict: true,
            deprecationErrors: true,
        }
    }
);

async function getMaster(){
    try{
        await client.connect();
        const coll = client.db(process.env.DB_NAM).collection(process.env.CL_MAS);
        const result = await coll.findOne({});
        return result;
    }catch(err){
        console.log("error ",err);
    }finally{
        await client.close()
    }
}

async function getUsers(){
    try{
        await client.connect();
        const coll = client.db(process.env.DB_NAM).collection(process.env.CL_USR);
        const result = await coll.find({}).toArray();
        return result;
    }catch(err){
        console.log("Error in getUsers ",err);
        return null;
    }finally{
        await client.close();
    }
}

/**
 * Sets the employee status based on the activeStatus
 * 0 - disabled, not used for total employee count and analytics
 * 1 - enabled, by default, used for total employee count and analytics
 * @param {*} empEmail 
 * @param {*} activeStatus 
 */
async function setUserState(s_empEmail,i_activeStatus){
    try{
        //console.log("in setUserState db..");
        await client.connect();
        const status = [];
        //update users
        const coll = client.db(process.env.DB_NAM).collection(process.env.CL_USR);
        var updateStatus =  await coll.updateOne(
            { "Email":s_empEmail },
            { $set: {"is_Active":i_activeStatus}},
            function(err,result){
            if(err){
                console.log("Error in setUserState users..",err);
                return null;
            }
            return 1;
        });
        status.push(updateStatus);
        //update scores
        //{"skills_master.user.u_id":s_empEmail}
        const colEmpScores = client.db(process.env.DB_NAM).collection(process.env.CL_EMP);
        console.log("Setting status for skills_master.user.u_id",s_empEmail);
        console.log("Setting status for isActive ",i_activeStatus);
        var updateStatus1 =  await colEmpScores.updateOne(
            { "skills_master.user.u_id":s_empEmail },
            { $set: {"skills_master.user.isActive":i_activeStatus}},
            function(err,result){
            if(err){
                console.log("Error in setUserState employee..",err);
                return null;
            }
            return 1;
        });
        status.push(updateStatus1);
        //console.log(updateStatus);
        return status;

    }catch(err){
        console.log("Error in setUserState.. : ",err);
        return null;
    }finally{
        await client.close();
    }
}

async function setUserAdmin(s_email,i_AdminStatus){
    try{
        //console.log("in setUserAdmin db..");
        const role = i_AdminStatus===1 ? "Admin" : "User";
        const status = [];
        await client.connect();
        const coll = client.db(process.env.DB_NAM).collection(process.env.CL_USR);
        var updateStatus =  await coll.updateOne(
            { "Email":s_email },
            { $set: {"Role":role}},
            function(err,result){
            if(err){
                console.log("Error in setUserAdmin..",err);
                return null;
            }
            return 1;
        });
        //console.log(updateStatus);
        //return updateStatus;
        status.push(updateStatus);

        const colEmpScores = client.db(process.env.DB_NAM).collection(process.env.CL_EMP);
        //console.log("Setting status for skills_master.user.u_id",s_email);
        //console.log("Setting status for Role ",role);
        var updateStatus1 =  await colEmpScores.updateOne(
            { "skills_master.user.u_id":s_email },
            { $set: {"skills_master.user.Role":role}},
            function(err,result){
            if(err){
                console.log("Error in setUserState employee..",err);
                return null;
            }
            return 1;
        });

        status.push(updateStatus1);

    return status;

    }catch(err){
        console.log("Error in setUserAdmin : ",err);
        return null;
    }finally{
        await client.close();
    }
}

async function getUserScores() {
    try{
        await client.connect();
        const coll = client.db(process.env.DB_NAM).collection(process.env.CL_EMP);
        const result = await coll.find({}).toArray();
        return result;
    } finally{
        await client.close()
    }
}

async function getHierarchyMaster(){
    try{
        await client.connect();
        const coll = client.db(process.env.DB_NAM).collection(process.env.CL_HIE);
        const result = await coll.findOne();
        return result;
    }catch{
        return null;
    }finally {
        await client.close();        
    }
}

// This script is for importing users from igs-users-import 
// (which is an excel to json of igs users)
// The script has to be run in this order to function
// await Script_importUsersFrom_igs_users_import()
// await Script_setDBInitUserScores()

async function Script_importUsersFrom_igs_users_import(){
    try {
        console.log('in Script_importUsersFrom_igs_users_import..');
        await client.connect();
        const coll = client.db(process.env.DB_NAM).collection("igs-users-import");
        const result = await coll.findOne({});
        console.log("users length",result.users.length);
        for(var i=0;i<result.users.length;i++){
            const newcol = client.db(process.env.DB_NAM).collection(process.env.CL_USR);
            console.log("inserting doc ",await newcol.insertOne(result.users[i]));
        }
    }catch(err){
        console.log("err in self dest..",err);
    }finally{
        await client.close()
    }
}
/*User Import Script
//This function is to initialize all users with sv_scores
async function Script_setDBInitUserScores(){
    try {
        const users = await getUsers();
        const Hierarchy_Map = await getHierarchyMaster();
        const masterDb = await getMaster();
        //console.log("all users ",users);
        const hFlatMap = await Script_getHierarchy(Hierarchy_Map);
        for(var i=0;i<users.length;i++){
            console.log("User is ",users[i]);
            await Script_initUserScores(users[i],hFlatMap,masterDb);
        }
    } catch (err) {
        console.log("error in setDBInitUserScores",err);
        return null;
    }
}

// //This has to be run as a script and is not
// //exposed to the API Layer
async function Script_initUserScores(user,Hierarchy_Map,empMaster){
    try{
        console.log("in initUserScores db..");
        const newUserObject = user;
        console.log("user details ",user);
        
        //now get the master score template and set user data
        const usrMasterObject = empMaster;
        delete usrMasterObject?._id;
        console.log("about to in user ",usrMasterObject);
        usrMasterObject.skills_master.user.u_id = newUserObject?.Email??"";
        usrMasterObject.skills_master.user.name = newUserObject?.First_Name.concat(' ',newUserObject?.Last_Name);
        usrMasterObject.skills_master.user.isActive = 1;
        usrMasterObject.skills_master.user.Role = newUserObject?.Role;
        usrMasterObject.skills_master.user.details.designation.hierarchy_id = newUserObject?.Hierarchy_Map??"";
        console.log("Hierarchy Progression is ", Hierarchy_Map);
        console.log("User Hierarchy Progression is ", newUserObject?.Hierarchy_Map);

        usrMasterObject.skills_master.user.details.designation.hierarchy_name = Hierarchy_Map.find(hierarchy => 
                                                                                hierarchy.key==newUserObject?.Hierarchy_Map)?.value;
        usrMasterObject.skills_master.user.details.designation.name = newUserObject?.Designation??"";
        
        //add this to the sv_scores collection
        await client.connect();
        const coll = client.db(process.env.DB_NAM).collection(process.env.CL_EMP);
        let updateStatus =  await coll.insertOne(usrMasterObject);
        console.log( "new user objec tis  ", usrMasterObject);
        updateStatus["InitUser"]="OK";
        console.log(updateStatus);     
        return updateStatus;

    }catch(err){
        console.log("failed trying to initalized user Scores..",err);
        return null;
    }finally{
        await client.close();
    }
}

const Script_getHierarchy = async(hp) =>{
    try{
      console.log("got hierarchy..",hp);
      const progressionPairs = [];
      const hierarchyProgression = hp["Hierarchy_Progression"];
      hierarchyProgression.forEach(hierarchy => {
        const progression = hierarchy.Progression;
        if (Array.isArray(progression)) {
          // If progression is an array, iterate over each object
          progression.forEach(progressionObj => {
            Object.entries(progressionObj).forEach(([key, value]) => {
              if (key !== 'id' && key !== 'name') {
                progressionPairs.push({ key, value });
              }
            });
          });
        } else {
          // If progression is an object, extract key-value pairs
          Object.entries(progression).forEach(([key, value]) => {
            progressionPairs.push({ key, value });
          });
        }
      });
  
      return progressionPairs;
  
    }catch(err){
      console.log("error in getHierarchy Service ",err);
      return null;
    }
};
*/

async function getEmpDesignationCount(designationArray){
    try{
        await client.connect();
        const coll = client.db(process.env.DB_NAM).collection(process.env.CL_EMP);
        const empCounts = [];
        designationArray = designationArray.filter(element=>element!=="m1" && element !=="m2");
        for(var i=0;i<designationArray.length;i++){
            const empDesignation={};   
            const filter = {"skills_master.user.details.designation.hierarchy_name":designationArray[i]}; 
            const count = await coll.countDocuments(filter);
            empDesignation[designationArray[i]]=count;
            empCounts.push(empDesignation);
        }
        return empCounts;        
    }catch(err){
        console.log("Error in getEmpDesignationCount db ",err);
        return null;
    }finally{
        client.close();
    }
}

async function getAnalytics(){
    try{
        const analyticsObj = await calculateAnalytics();
        if (analyticsObj){
            await client.connect();
            //console.log("updating analytics..", "{a_id:1}");
            const coll = client.db(process.env.DB_NAM).collection(process.env.CL_ANL);
            const result = await coll.replaceOne({"a_id":"1"},analyticsObj,{upsert:true});
            //console.log("finishied updating with status ",result);
            await client.close();
            return analyticsObj;
        }
        return null;
    }catch(err){
        console.log(err);
        return null;
    }
}

async function calcCategoryAggregates(masterDb,empDb){
    try{
        var skillsCatList = [];
        var skillsList = [];
        masterDb?.skills_master?.categories.forEach(masterCategory =>{
            // console.log("Iterating master category ",masterCategory.name);
            masterCategory["sub-category"].forEach(masterSubCat =>{ 
                var skillsSubCatList = [];
                var scskillsList = [];
                // console.log("Iterating master sub cateogory ",masterSubCat.name);
                masterSubCat.concern.forEach(skill =>{
                    // console.log("skill name ",skill.name);
                    var sc_skill_score = 0;
                    var sc_skill_total = 0;
                    var skillObj = {
                        skill_total:0,
                        skill_score:0,
                        skill_name:skill.name,
                        skill_sc:masterSubCat.name,
                        skill_c:masterCategory.name,
                        0:0,
                        1:0,
                        2:0,
                        3:0,
                        4:0
                    };
                    empDb.forEach(employee =>{
                        const empSkill = employee?.skills_master?.categories.find(cat =>cat.name===masterCategory.name)
                        ?.["sub-category"].find(sc => sc?.name===masterSubCat?.name)?.concern.find(con => con?.name===skill.name);        
                        skillObj.skill_total += 4;
                        skillObj.skill_score += empSkill.score;        
                        sc_skill_score+=empSkill.score;
                        sc_skill_total+=empSkill.total;
                        switch(Number(empSkill.score)){
                            case 0:
                                //console.log("0s ",skillObj);
                                skillObj["0"]+=1;
                                break;
                            case 1:
                                //console.log("1s ",skillObj["1"], skillObj);
                                skillObj["1"]+=1;
                                break;
                            case 2:
                                skillObj["2"]+=1;
                                break;
                            case 3:
                                skillObj["3"]+=1;
                                break;
                            case 4:
                                skillObj["4"]+=1;
                                break;
                            default:
                            }
                    });
                    skillsList.push(skillObj);
                    scskillsList.push(skillObj);
                });
                var existsObjCategory = skillsCatList.find(category=>category.name===masterCategory.name);
                if (!existsObjCategory){     
                    //add sub-category object to category List
                    var subcatObj = new Object({
                        name:masterSubCat.name,
                        total_score:scskillsList.reduce((acc,cur) => acc + parseInt(cur?.skill_total),0),
                        my_score:scskillsList.reduce((acc,cur) => acc + parseInt(cur?.skill_score),0),
                        skills:scskillsList
                    });         
                    const catObj = new Object({
                        name:masterCategory.name,
                        total_score:scskillsList.reduce((acc,cur) => acc + parseInt(cur?.skill_total),0),
                        my_score:scskillsList.reduce((acc,cur) => acc + parseInt(cur?.skill_score),0),
                        sub_category:[]
                    });
                    catObj.sub_category.push(subcatObj);
                    skillsCatList.push(catObj);
                }else{
                    //fetch category object and add the new sub-category
                    var subcatObj = new Object({
                        name:masterSubCat.name,
                        total_score:scskillsList.reduce((acc,cur) => acc + parseInt(cur?.skill_total),0),
                        my_score:scskillsList.reduce((acc,cur) => acc + parseInt(cur?.skill_score),0),
                        skills:scskillsList
                    });         
                    //add all sub-category total for category object
                    existsObjCategory.sub_category.push(subcatObj);
                    for(var i=0;i<skillsCatList.length;i++){
                        if(skillsCatList[i].name===existsObjCategory.name){
                            skillsCatList[i] = existsObjCategory;
                            skillsCatList[i].total_score = skillsCatList[i]?.sub_category.reduce((acc,cur) => acc+
                                                           parseInt(cur.total_score),0)
                            skillsCatList[i].my_score = skillsCatList[i]?.sub_category.reduce((acc,cur)=> acc+
                                                           parseInt(cur.my_score),0)
                        }
                    }
                }
            });
            
        });

        return await skillsCatList;

    }catch(err){
        console.log("Error in calcCategoryAggregates db : ",err);
        return null;
    }
}

async function calculateAnalytics(){
    try{
        const masterDb = await getMaster();
        const empScoresDb = await getUserScores();
        const admins = await getUsers();
        const adminCount = admins.reduce((acc,cur) => acc + parseInt(cur.Role==="Admin"?1:0),0);
        const activeEmployees = empScoresDb.filter(employee =>
                 Boolean(employee.skills_master.user.isActive) && 
                   (employee.skills_master.user.Role==="User")
        );
        const categoryAggregates = await calcCategoryAggregates(masterDb,activeEmployees);
        const lstActExp = await getChartData(activeEmployees, masterDb);
        const certificates = await getCertificationAgg(masterDb,activeEmployees);
        const topSkills = await getTopSkills(lstActExp);
        const quadAggregates = await getQuadrantAnalytics(categoryAggregates);
        const analyticsObj = {
            "a_id":"1",
            "total_employees":activeEmployees.length,
            "total_admins":adminCount,
            "top_5_skills":topSkills,
            "chart_ac_ex_data":lstActExp,
            "certification_aggregates": certificates,
            "category_aggregates":categoryAggregates,
            "quadrant_aggregates":quadAggregates,
            "last_updated":Date.now()
        }
        return analyticsObj;
    }catch(err){
        console.log("Error in calculateAnalytics db : ",err);
        return null;
    }
}

async function getChartData(empScoresDb, masterDb) {
    const lstActExp = [];
    const totalCategories = masterDb?.skills_master?.categories;

    for (var i = 0; i < totalCategories.length; i++) {
        const objActExp = new Object({
            "name": "",
            "total_score": 0.0,
            "actual_score": 0.0
        });
        objActExp.name = totalCategories[i].name;
        //console.log("Interating Category :",objActExp.name);
        let total_score = 0.0;
        let actual_score = 0.0;
        for (var j = 0; j < empScoresDb.length; j++) {
            let cat = empScoresDb[j]?.skills_master?.categories.filter(userCategory => {
                if (userCategory.name.trim() === objActExp.name.trim()) {
                    return userCategory;
                }
            });
            if (cat[0]) {
                cat = cat[0];
            }
            if (cat) {
                //console.log("cat is ",cat.my_score);
                if (cat?.total_score) {
                    total_score += parseFloat(cat?.total_score);
                } else {
                    total_score += 0;
                }
                if (cat?.my_score) {
                    actual_score += parseFloat(cat?.my_score);
                } else {
                    actual_score += 0;
                }
            }
        }
        objActExp.total_score = total_score;
        objActExp.actual_score = actual_score;
        lstActExp.push(objActExp);
        total_score = 0.0;
        actual_score = 0.0;
    }
    return lstActExp;
}

async function getCertificationAgg(masterDb,empScoresDb){
    const certifications = masterDb?.skills_master?.certifications;
    let allCertificates = [];
    for(var i=0;i<certifications.length;i++){
        const empCertificate = {
            "name":certifications[i]?.c_name,
            "total":empScoresDb.length,
            "actual":0,
            "percentage":0.0
        };
        for(var j=0;j<empScoresDb.length;j++){
            const my_certificate = empScoresDb[j]?.skills_master?.certifications?.filter(cert =>{
                if(cert.c_name===certifications[i]?.c_name){
                    return cert;        
                }
            });
            //console.log("my_certification ",my_certificate);
            if(my_certificate[0]){
                empCertificate.total = empScoresDb.length;
                if (my_certificate[0].acquired===true){
                    empCertificate.actual+=1;
                }
            }
        }
        empCertificate.percentage=(empCertificate.actual/empCertificate.total)*100;
        allCertificates.push(empCertificate);
    }
    return allCertificates;
}

async function getTopSkills(lstActExp){
    const lstTopSkills = [];
    for(var i=0;i<lstActExp.length;i++){
        var skillObj = {
            "rank":1,
            "name":lstActExp[i].name,
            "percentage":((lstActExp[i].actual_score/lstActExp[i].total_score)*100).toFixed(2)
        }
        lstTopSkills.push(new Object(skillObj));
    }
    lstTopSkills.sort((a,b)=> b.percentage - a.percentage);
    lstTopSkills.forEach((obj,index)=>{
        obj.rank = index+1;
    });
    return await lstTopSkills;
}

async function getQuadrantMap(){
    try {
        await client.connect();
        const coll = client.db(process.env.DB_NAM).collection(process.env.CL_QUA);
        const result = await coll.findOne();
        return result;
    } catch (err) {
        console.log("Error in getQuadrantMap db : ",err);
        return null;
    }finally{
        await client.close();
    }
}

async function getQuadrantAnalytics(empCategoryAggregates){
    try {
        let quadrantMap = await getQuadrantMap();
        quadrantMap.Quadrants.forEach(quadrant=>{
            let quadTotalScore = 0;
            let quadMyScore = 0;
            quadrant.SubCategories.forEach(quadSubCategory =>{
                //interate through all the categories
                for(var i=0;i<empCategoryAggregates.length;i++){
                  const quadCategory = empCategoryAggregates[i].sub_category.find(sc=>sc.name===quadSubCategory);
                  if(quadCategory){
                    quadTotalScore+= quadCategory.total_score;
                    quadMyScore+=quadCategory.my_score;
                  }                 
                }
            });
            quadrant.Total = quadTotalScore;
            quadrant.Score = quadMyScore;
        });
        return quadrantMap.Quadrants;
    } catch (err) {
        console.log("Error in getQuandrantAnalytics db ",err);
        return null;
    }
}

async function checkUserExists(s_userEmail){
    try{
        await client.connect();
        //console.log("in checkUserExists..");
        const coll = client.db(process.env.DB_NAM).collection(process.env.CL_USR);
        const user = await coll.findOne({"Email":s_userEmail});
        if(user){
            //console.log("found user ",user);
            return 1;
        }
        else{
            return 0;
        }
    }catch(err){
        console.log("error in checkuserExists ",err);
        return null;
    }finally{
        await client.close();
    }
}

async function addNewUser(user){
    try{
        await client.connect();
        const coll = client.db(process.env.DB_NAM).collection(process.env.CL_USR);
        const userDocument = user;
        //console.log('user doc is ', userDocument);
        userDocument["is_Active"]=1;
        userDocument["is_Virgin"]=1;
        userDocument["Password"]=process.env.PW_USR;
        let updateStatus =  await coll.insertOne(userDocument);
        updateStatus["AddUser"]="OK";
        //console.log(updateStatus);
        return updateStatus;
    }catch(err){
        console.log("failed trying to addnewusers ",err);
        return null;
    }finally{
        await client.close();
    }
}

//TODO : pick up Hierarchy_Name using Heirarchy_Map automatically
//currently, we are relying on the F.E to send it and it could be erroneous
async function initUserScores(user){
    try{
        //console.log("in initUserScores db..");
        const newUserObject = user;
        //console.log("user details ",user);      
        //now get the master score template and set user data
        const usrMasterObject = await getMaster();
        delete usrMasterObject?._id;

        //console.log("about to init User ",usrMasterObject);
        usrMasterObject.skills_master.user.u_id = newUserObject?.Email??"";
        usrMasterObject.skills_master.user.name = newUserObject?.First_Name.concat(' ',newUserObject?.Last_Name);
        usrMasterObject.skills_master.user.isActive = 1;
        usrMasterObject.skills_master.user.Role = newUserObject?.Role;
        usrMasterObject.skills_master.user.details.designation.hierarchy_id = newUserObject?.Hierarchy_Map??"";
        usrMasterObject.skills_master.user.details.designation.hierarchy_name = newUserObject?.Hierarchy_Name??""; 
        usrMasterObject.skills_master.user.details.designation.name = newUserObject?.Designation??"";
        
        //add this to the sv_scores collection
        await client.connect();
        const coll = client.db(process.env.DB_NAM).collection(process.env.CL_EMP);
        let updateStatus =  await coll.insertOne(usrMasterObject);
        //console.log( "new user object is  ", usrMasterObject);
        updateStatus["InitUser"]="OK";
        //console.log(updateStatus);     
        return updateStatus;

    }catch(err){
        console.log("Error,failed trying to initalized user Scores..",err);
        return null;
    }finally{
        await client.close();
    }
}

/**
 * The idea of reset password is for the admin 
 * to set a temporary password. 
 * this shall also set his virginity to be 1,
 * which shall force to change his password again on login
 * @param {*} employeeEmail 
 * @param {*} newPassword 
 * @returns 
 */
//every time an admin sets the password, 
//we force the user to change password, this is for the 
//user to change his password
async function resetPassword(employeeEmail,newPassword){
    try{
        await client.connect();
        const coll = client.db(process.env.DB_NAM).collection(process.env.CL_USR);
        var updateStatus =  await coll.updateOne(
            { "Email":employeeEmail },
            { $set: {"Password":newPassword,"is_Virgin":1}},
            function(err,result){
            if(err){
                console.log("Error setting resetPassword db..",err);
                return null;
            }
            return 1;
        });
        //console.log(updateStatus);
        return updateStatus;
    }catch(err){
        console.log("Error resetting password db : ",err);
    }finally{
        await client.close();
    }
}

async function updateCertificates(u_id,certificateObj){
try{
    //console.log("in setUserState db..");
    await client.connect();
    const status = [];
    //update users
    const coll = client.db(process.env.DB_NAM).collection(process.env.CL_EMP);
    var updateStatus =  await coll.updateOne(
        { "skills_master.user.u_id":u_id},
        { $set: {"skills_master.certifications":certificateObj}},
        function(err,result){
        if(err){
            console.log("Error in setUserState users..",err);
            return null;
        }
        return 1;
    });
    console.log(updateStatus);
    }catch(err){
        console.log(
            "Error in updateCertificates db ",err
        );
    }finally{
        await client.close();
    }
}

export default {
                getHierarchyMaster,            
                getEmpDesignationCount,
                getAnalytics,
                getUsers,
                getUserScores,
                setUserState,
                setUserAdmin,
                addNewUser,
                initUserScores,
                checkUserExists,
                resetPassword,
                getMaster,
                updateCertificates
}