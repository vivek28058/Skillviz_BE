//User Controller
import adminService from "../services/adminService.js";

const getNoScores = async (req, res) => {
  res.status(200).json(await adminService.getNoScores());
};

const getEmployeesHierarchy = async (req, res) => {
  res.status(200).json(await adminService.getEmployeesHierarchy());
};

const getHierarchy = async (req, res) => {
  res.status(200).json(await adminService.getHierarchy());
};

const getAnalytics = async (req, res) => {
  res.status(200).json(await adminService.getAnalytics());
};

const getUsers = async (req, res) => {
  res.status(200).json(await adminService.getUsers());
};

const setUserState = async (req, res) => {
  try {
    const {
      body: { isActive, employeeEmail },
    } = req;

    if (employeeEmail && typeof employeeEmail === "string") {
      if (isActive === null || typeof isActive === "number") {
        //do your shit
        const result = await adminService.setUserState(employeeEmail, isActive);
        if (result) {
          res.status(200).json({ Status: "OK", data: result });
        } else {
          res.status(500).json({ Status: "Failed" });
        }
      } else {
        res.status(400).json({ "Status ": "Error", data: "Missing isActive parameter or incorrect type.." });
      }
    } else {
      res.status(400).json({ "Status ": "Error", data: "Missing Email parameter or incorrect email type.." });
    }
  } catch (err) {
    res.status(400).json({ Status: "Error", data: err });
  }
};

const setUserAdmin = async (req, res) => {
  try {
    const {
      body: { isAdmin, employeeEmail },
    } = req;

    if (employeeEmail && typeof employeeEmail === "string") {
      if (isAdmin === null || typeof isAdmin === "number") {
        //do your shit
        const result = await adminService.setUserAdmin(employeeEmail, isAdmin);
        if (result) {
          res.status(200).json({ Status: "OK", data: result });
        } else {
          res.status(500).json({ Status: "Failed" });
        }
      } else {
        res.status(400).json({ "Status ": "Error", data: "Missing isActive parameter or incorrect type.." });
      }
    } else {
      res.status(400).json({ "Status ": "Error", data: "Missing Email parameter or incorrect email type.." });
    }
  } catch (err) {
    res.status(400).json({ Status: "Error", data: err });
  }
};

const searchSkills = async (req, res) => {
  try {
    const {
      body: { searchQry, searchQryCriteria, searchQryOperator },
    } = req;
    const result = await adminService.searchSkills(searchQry, searchQryCriteria, searchQryOperator);
    if (result) {
      res.status(200).json({ Status: "OK", data: result });
    } else {
      res.status(200).json({ Status: "Err", data: "Error" });
    }
  } catch (err) {
    console.log("error in serch skills controller..", err);
    res.status(200).json({ Status: "Err", data: err });
  }
};

const addUser = async (req, res) => {
  try {
    const {
      body: { First_Name, Last_Name, Email, Designation, Role, Hierarchy_Map, Hierarchy_Name },
    } = req;
    const user = {
      First_Name: First_Name,
      Last_Name: Last_Name,
      Email: Email,
      Designation: Designation,
      Role: Role,
      Hierarchy_Map: Hierarchy_Map,
      Hierarchy_Name: Hierarchy_Name,
    };
    const result = await adminService.addUser(user);
    if (result?.Status === "OK") {
      res.status(200).json({ Status: "OK" });
    } else {
      res.status(400).json({ Status: "Error", Data: result?.Data });
    }
  } catch (err) {
    console.log("error in addUser controller ", err);
    res.status(400).json({ Status: "Error", data: err });
  }
};

const resetPassword = async (req, res) => {
  try {
    const {
      body: { employeeEmail, newPassword },
    } = req;

    if (employeeEmail && typeof employeeEmail === "string") {
      if (newPassword === null || typeof newPassword === "string") {
        const result = await adminService.resetPassword(employeeEmail, newPassword);
        if (result) {
          res.status(200).json({ Status: "OK", data: result });
        } else {
          res.status(500).json({ Status: "Failed" });
        }
      } else {
        res.status(400).json({ "Status ": "Error", data: "Missing password parameter or incorrect type.." });
      }
    } else {
      res.status(400).json({ "Status ": "Error", data: "Missing Email parameter or incorrect email type.." });
    }
  } catch (err) {
    console.log("error in setPassword controller", err);
    res.status(400).json({ Status: "Error", data: err });
  }
};

const getMasterCategories = async (req, res) => {
  res.status(200).json(await adminService.getMasterCategories());
};

const getRolesTS = async(req,res) => {
  console.log("in controller , id is ", req.params.hKey);
  res.status(200).json(await adminService.getRolesTS(req.params.hKey));
};

const simpleSearch = async (req, res) => {
  const {
    body: { basicSearch },
  } = req;
  res.status(200).json({Status: "OK", data: await adminService.simpleSearch(basicSearch)});
};

const test = async(req,res) =>{
  res.status(200).json(await adminService.test());
};

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
                };