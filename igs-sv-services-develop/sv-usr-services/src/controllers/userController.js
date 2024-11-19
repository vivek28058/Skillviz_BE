//User Controller
import userService from "../services/userService.js";

const getMaster = async (req, res) => {
  res.status(200).json(await userService.getMasterData());
}

const getHierarchyMaster = async(req,res) =>{
  console.log("in get heir controller..");
  res.status(200).json(await userService.getHierarchyMaster());
}

const getUser = async (req, res) => {
  console.log("in controller , id is ", req.params.empId);
  res.status(200).json(await userService.getOneUser(req.params.empId));
}

const updateUser = async (req, res) => {
  const {
      body,
      params :{empId},
  } = req;

  if(!empId){
    return;
  }
  const result = await userService.updateUserScores(empId,body);
  if (result){
    res.status(200).json({"Status":"OK",data:result});
  }else{
    res.status(500).json({"Status":"Failed"});
  }
}

const updateCertificates = async(req,res) =>{
  const {
    body,
    params :{empId},
  } = req;

  if(!empId){
    return;
  }

  const result = await userService.updateCertificates(empId,body);
  if (result){
    res.status(200).json({"Status":"OK",data:result});
  }else{
    res.status(500).json({"Status":"Failed"});
  }
}

const updateEducation = async (req,res) =>{
  const{
    body,
    params :{empId},
  } = req;

  const result = await userService.updateEducation(empId,body);
  if (result){
    res.status(200).json({"Status":"OK",data:result});
  }else{
    res.status(500).json({"Status":"Failed"});
  }
}

const updateExperience = async(req,res) =>{
  const{
    body,
    params:{empId},
  } = req;

  const result = await userService.updateExperience(empId,body);
  if (result){
    res.status(200).json({"Status":"OK",data:result});
  }else{
    res.status(500).json({"Status":"Failed"});
  }
}

const setPassword = async(req,res) =>{
  try{
      const {
        body: {employeeEmail,newPassword}
      } = req;

      if(employeeEmail && typeof employeeEmail==='string'){
        if( newPassword===null || typeof newPassword==='string'){
          const result = await userService.setPassword(employeeEmail,newPassword);
          if (result){
            res.status(200).json({"Status":"OK",data:result});
          }else{
            res.status(500).json({"Status":"Failed"});
          }
        }else{
          res.status(400).json({"Status " :"Error","data" :"Missing password parameter or incorrect type.."});   
        }
      }else{
        res.status(400).json({"Status " :"Error","data" :"Missing Email parameter or incorrect email type.."});
      }

  }catch(err){
    console.log("error in setPassword controller",err);
    res.status(400).json({"Status":"Error","data":err});
  }
};

const updateScore = async(req,res) =>{
  const{
    body:{category,subCategory,skill,score},
    params:{empId},
  } = req;
  const result = await userService.updateScore(empId,category,subCategory,skill,score);
  if (result){
    res.status(200).json({"Status":"OK",data:result});
  }else{
    res.status(500).json({"Status":"Failed"});
  }
}

export default {  
                  getMaster,
                  getHierarchyMaster,
                  getUser,
                  updateUser,
                  updateCertificates,
                  updateEducation,
                  updateExperience,
                  setPassword,
                  updateScore
                };