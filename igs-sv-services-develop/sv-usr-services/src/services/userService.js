// User Service Layer

import userDb from "../database/userDb.js";

const getOneUser = async (id) => {
  console.log("in user service, id is ", id);
  let userScores = await userDb.getUserData(id);
  if (userScores) {
    const strExperience = await calculateTotalExperience(userScores.skills_master.experience);
    userScores.skills_master.user.details.experience = strExperience;
  }
  return userScores ?? null;
};

const getMasterData = async () => {
  return await userDb.getMasterData();
};

const updateUserScores = async (id, doc) => {
  return await userDb.updateUserScores(id, doc);
};

const updateCertificates = async (id, doc) => {
  return await userDb.updateCertificates(id, doc);
};

const updateExperience = async (id, doc) => {
  return await userDb.updateExperience(id, doc);
};

const updateEducation = async (id, doc) => {
  return await userDb.updateEducation(id, doc);
};

const getHierarchyMaster = async () => {
  return await userDb.getHierarchyMaster();
};

const setPassword = async (employeeEmail, newPassword) => {
  return await userDb.setPassword(employeeEmail, newPassword);
};

async function calculateTotalExperience(experiencesList) {
  // Get today's date
  const currentDate = new Date();

  //console.log("experiences are ",experiencesList);
  // Initialize variables to store total years, months, and days
  let totalYears = 0;
  let totalMonths = 0;
  let totalDays = 0;

  // Iterate through each experience
  experiencesList.forEach((experience) => {
    // Parse start date
    const startDate = new Date(experience.start_date);

    // Parse end date or set it as today's date if it's null
    const endDate = experience.end_date ? new Date(experience.end_date) : currentDate;

    // Calculate the difference in years, months, and days
    let diffYears = endDate.getFullYear() - startDate.getFullYear();
    let diffMonths = endDate.getMonth() - startDate.getMonth();
    let diffDays = endDate.getDate() - startDate.getDate();

    // Adjust for negative months or days
    if (diffDays < 0) {
      diffMonths--;
      diffDays += 30; // Assuming 30 days in a month for simplicity
    }
    if (diffMonths < 0) {
      diffYears--;
      diffMonths += 12;
    }

    // Add the difference to the total
    totalYears += diffYears;
    totalMonths += diffMonths;
    totalDays += diffDays;
  });

  // Adjust total months and days if they exceed their respective units
  totalMonths += Math.floor(totalDays / 30);
  totalDays %= 30;
  totalYears += Math.floor(totalMonths / 12);
  totalMonths %= 12;

  // Return the formatted string
  return validateAndFormatExperience(totalYears, totalMonths, totalDays);
}

function validateAndFormatExperience(years, months, days) {
  // Check if years, months, and days are non-negative integers
  if (
    years < 0 ||
    months < 0 ||
    days < 0 ||
    !Number.isInteger(years) ||
    !Number.isInteger(months) ||
    !Number.isInteger(days)
  ) {
    return "Invalid input"; // Experience cannot be negative or non-integer
  }

  // Check if all values are 0, return "0 year(s)" in that case
  if (years === 0 && months === 0 && days === 0) {
    return "0 year(s)";
  }

  // Prepare the formatted string with values more than 0
  let formattedString = "";
  if (years > 0) {
    formattedString += years + " year(s) ";
  }
  if (months > 0) {
    formattedString += months + " month(s) ";
  }
  if (days > 0) {
    formattedString += days + " day(s) ";
  }
  // Trim any trailing space and return the formatted string
  return formattedString.trim();
}

const updateScore = async(empId,category,subCategory,skill,score)=> {
  try{
    userDb.updateScore(empId,category,subCategory,skill.score);
  }catch(err){
    console.log("Error in updateScore service ",err);
  }
};

export default {
  getHierarchyMaster,
  getOneUser,
  getMasterData,
  updateUserScores,
  updateCertificates,
  updateExperience,
  updateEducation,
  setPassword,
  updateScore,
};
