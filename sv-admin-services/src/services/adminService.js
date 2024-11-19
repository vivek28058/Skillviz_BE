// User Service Layer

import adminDb from "../database/adminDb.js";
import Fuse from "fuse.js";

const getEmployeesHierarchy = async() =>{
  const hierarchy =  await adminDb.getHierarchyMaster(); 
  //console.log("got heirarchy..",hierarchy);

  try{
    // Extracting Progression values into a single array
    const allProgressions = hierarchy["Hierarchy_Progression"].flatMap(entry => {
      if (Array.isArray(entry.Progression)) {
        // Handling case where Progression is an array
        return entry.Progression.flatMap(progression => Object.values(progression));
      } else {
        // Handling case where Progression is an object
        return Object.values(entry.Progression);
      }
    });
    //console.log("all progressions ", allProgressions);
    //get employees for all progressions
    //key :"designation"
    //value : count
    return adminDb.getEmpDesignationCount(allProgressions);
    //return allProgressions;

  }catch(err){
    console.log("err in srv getemployeeshierarchy ",err);
    return null;
  }
};

const getHierarchy = async() =>{
  try{
    const hp =  await adminDb.getHierarchyMaster(); 
    //console.log("got hierarchy..",hp);
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

const getAnalytics = async () =>{
  return await adminDb.getAnalytics();
};

const getUsers = async() =>{
  return await adminDb.getUsers();
};

const getRolesTS = async(hId) => {
  const all_users = await adminDb.getUsers();
  let result = null;
  try{
    if(all_users){
      result  = await all_users.filter(user=> parseInt(user.Hierarchy_Map)=== parseInt(hId))
    }else{
      return null;
    }
    return result;
  }catch(err){
    console.log("error in getRolesTS service,",err);
    return null
  }
};

const setUserState = async (s_email,i_activeStatus)=>{
  return await adminDb.setUserState(s_email,i_activeStatus);
};

const setUserAdmin = async (s_email,i_AdminStatus) =>{
  return await adminDb.setUserAdmin(s_email,i_AdminStatus);
};

const addUser = async(user) =>{
  const userExists = await adminDb.checkUserExists(user.Email);
  //console.log("user exists service ",userExists);
  if(userExists){
    return {"Status":"Error","Data":"User exists.."}
  }
  //TODO : This has to be an atomic process aka a transaction
  //addNewUser && initUserScores --Commit otherwise --Rollback
  const addStatus = await adminDb.addNewUser(user);
  if(addStatus?.AddUser === "OK"){
      const initStatus = await adminDb.initUserScores(user);
      if (initStatus?.InitUser ==="OK"){
        return {"Status":"OK"};
      }else{
        return null;
      }
  }else{
    return addStatus;
  }
};

/**
 *  //get all employee_scores
 *  //for each employee score
    //for each category, sub-category and skill in searchQry,
    //return employee who's score matches searchCriteria
    //searchCriteria - gte - (Skill_Score AND Skill_Score AND Skill_Score...) gte criteria_val
    //searchCriteria - per - (Skill_Score AND Skill_Score AND Skill_Score...) per criteria_val
 * @param {*} searchJson 
 * @param {*} searchCriteria 
 * @returns all employees who matches the searchJson categories, subcategories, skills and searchCriteria
 */
const searchSkills = async (searchQry,searchQryCriteria,searchQryOperator)=>{
  try {
    //let searchJson=[{"categoryName":"Business Domain","subCategoryNames":["Domain"],"skillNames":["OTT","Healthcare - Remote Patient Monitoring"]}];
    //let searchCriteria = {"criteria_name":"gte","criteria_val":1};
    let matches = [];
    let empScores = await adminDb.getUserScores();
    empScores = empScores.filter(employee =>{
      return Boolean(employee.skills_master.user.isActive) && 
             Boolean(employee.skills_master.user.Role==="User")
    });
    
    //console.log("empScores Len ",empScores.length);
    for(var i=0;i<empScores.length;i++){
      //check if the skills are included
      var isEligible = true;
      var searchEvalList = [];
      for(var j=0;j<searchQry.length;j++){
        //console.log("catName ",searchQry[j].categoryName);
        var empCat = empScores[i].skills_master.categories.find(cat=>cat.name===searchQry[j].categoryName);
        //console.log("sub cat is ",empCat["sub-category"]);
        for(var k=0;k<empCat["sub-category"].length;k++){            
          if(searchQry[j].subCategoryNames.includes(empCat["sub-category"][k].name)){
              for(var l=0;l<searchQry[j].skillNames.length;l++){
                //console.log("search skill:",searchQry[j].skillNames[l]);
                const matchedSkill = empCat["sub-category"][k].concern.find(skill =>  skill.name===searchQry[j].skillNames[l]);
                if(matchedSkill){
                  if(matchedSkill.score >=searchQryCriteria.criteria_val){
                    isEligible = true;
                    searchEvalList.push(isEligible);
                  }
                  else{
                    isEligible = false;
                    searchEvalList.push(isEligible);
                  }
                }
              }
          }
        }
      } //if (isEligible===true){matches.push(empScores[i])}
      const result = await evaluateSearchQueries(searchEvalList,searchQryOperator);
      if(result){
        matches.push(empScores[i].skills_master.user);
      }
    }
    console.log("Search results count : ",matches.length);
    var results = {
      count:matches.length,
      matches:matches
    }
  return results;
}catch (err) {
    console.log("Error in searchSkills svc : ",err);
    return null;
}
};

const evaluateSearchQueries = async (searchQueryEvalList,searchQryOperator)=>{
    var evalString = "";
    var operator = (searchQryOperator==="AND") ? '&&' : '||';

    for(var i=0;i<searchQueryEvalList.length;i++){
      if(i==searchQueryEvalList.length-1){
        evalString+=searchQueryEvalList[i];
      }else{
        evalString+=searchQueryEvalList[i]+operator;
      }
    }
    // console.log("evalString is ", evalString, "value is ",eval(evalString));
    const flag = await eval(evalString);
    return flag;
}

const resetPassword = async (employeeEmail,newPassword )=>{
  return await adminDb.resetPassword(employeeEmail,newPassword);
};

const getMasterCategories = async() =>{
  try{
    const masterData = await adminDb.getMaster();
    if(masterData){
      return masterData.skills_master.categories;
    }return null;
  }catch(err){
    console.log("Error in getMasterCategories svc ",err);
    return null;
  }
};

const getNoScores = async() =>{
  const no_score_users = [];
  try{
    const sv_scores = await adminDb.getUserScores();
    for(var i=0;i<sv_scores.length;i++){
      //check for all sub-category scores as zero
      let score_is_zero=true;
      for(var j=0;j<sv_scores[i].skills_master.categories.length;j++){
        if(sv_scores[i].skills_master.categories[j].my_score!==0){
          score_is_zero = false;
          break;
        }  
      }
      if(score_is_zero){
        no_score_users.push(sv_scores[i].skills_master.user);
      }
    }
    return {
      "total_no_score_users":no_score_users.length,
      "users":no_score_users
    };
  }catch(err){
    console.log("Error in getNoScores svc ",err);
    return null;
  }
};

const simpleSearch = async(basicSearch) =>{
  try {
   //all employees
   const allEmpData = await adminDb.getUserScores();
   const fuse = new Fuse(allEmpData, {
      isCaseSensitive: false,
      includeScore: true,
      shouldSort: true,
      includeMatches: true,
      findAllMatches: true,
      // minMatchCharLength: 1,
      // location: 0,
      threshold: 0.2,
      // distance: 1,
      useExtendedSearch: true,
      // ignoreLocation: true,
      // ignoreFieldNorm: false,
      // fieldNormWeight: 1,
      keys: [
      "skills_master.user.name",
      "skills_master.user.details.designation.name",
      "skills_master.certifications.c_name",
      "skills_master.certifications.acquired",
      "skills_master.categories.sub-category.concern.name",
      "skills_master.categories.sub-category.concern.score",
      ]
    });

    const results = fuse.search({
        $or: [
        { "skills_master.user.name": `"${basicSearch}"` },
        { "skills_master.user.details.designation.name": `"${basicSearch}"` },
        {
          $and: [
            { "skills_master.certifications.c_name": `"${basicSearch}"` },
            { "skills_master.certifications.acquired": "true" },
          ],
        },
        {
          $and: [
            { "skills_master.categories.sub-category.concern.name": `"${basicSearch}"` },
            { "skills_master.categories.sub-category.concern.score": "!0" },
          ],
        },
      ],
    });
    const filteredResult = results
      .filter((result) => {
        let matchRefIndex;
        return result.matches?.some((match) => {
          if (match.key === "skills_master.certifications.c_name" && match.value?.toLowerCase().includes(basicSearch))
            matchRefIndex = match.refIndex;
          if (
            match.key === "skills_master.categories.sub-category.concern.name" &&
            match.value?.toLowerCase().includes(basicSearch)
          )
            matchRefIndex = match.refIndex;
          if (match.key === "skills_master.certifications.acquired" && match.refIndex === matchRefIndex) return true;
          if (match.key === "skills_master.categories.sub-category.concern.score" && match.refIndex === matchRefIndex)
            return true;
          if (match.key === "skills_master.user.name") return true;
          if (match.key === "skills_master.user.details.designation.name") return true;
          return false;
        });
      }).map((user) => user.item.skills_master.user);
      var resultsSimpleSearch={
        count:filteredResult.length,
        matches:filteredResult
      }
    return resultsSimpleSearch;
    
  } catch (err) {
    console.log("error in simple search..",err);
    return null;
  }
}

const test = async() =>{
  try {
   //all employees
   const allEmpData = await adminDb.getUserScores();
   for(var i=0;i<allEmpData.length;i++){
      var newCertificates = allEmpData[i].skills_master.certifications.map( certificate => {
          if(Object.keys(certificate).includes("acquired")){
            return certificate;
          }else{
            certificate["acquired"] = false;
            return certificate;
          }
      });
      console.log("bob ", newCertificates);
      await adminDb.updateCertificates(allEmpData[i].skills_master.user.u_id,newCertificates)

   }

   var result={
    status:"success",
    data:allEmpData
  }
  
  return result;

    
  } catch (err) {
    console.log("Error in test service..",err);
    return null;
  }
}


export default {
                getHierarchy,
                getEmployeesHierarchy,
                getAnalytics,
                getUsers,
                setUserState,
                setUserAdmin,
                addUser,
                searchSkills,
                resetPassword,
                getMasterCategories,
                getNoScores,
                simpleSearch,
                test,
                getRolesTS
}