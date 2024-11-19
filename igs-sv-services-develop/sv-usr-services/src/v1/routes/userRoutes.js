//routes for users endpoint
import express from "express";
import userController from "../../controllers/userController.js";
const userRouter = express.Router();

userRouter.get("/master",userController.getMaster);
userRouter.get("/hierarchy",userController.getHierarchyMaster);
userRouter.get("/:empId",userController.getUser);

userRouter.post("/password",userController.setPassword);
userRouter.post("/:empId",userController.updateUser);
userRouter.post("/education/:empId",userController.updateEducation);
userRouter.post("/experience/:empId",userController.updateExperience);
userRouter.post("/certificates/:empId",userController.updateCertificates);
userRouter.post("/score/update/:empId",userController.updateScore);

export default userRouter;