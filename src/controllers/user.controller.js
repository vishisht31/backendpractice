import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";


const registerUser = asyncHandler(async (req,res)=>{
    const {fullName,email,username,password }=req.body;
    console.log("email",email);

    if(
        [fullName,email,username,password].some((field)=>field?.trim()==="")
    ){
        throw new ApiError(400,"All fields are required");  
    }
    const existedUser =  User.findOne({
        $or:[{email},{username}]
    })
    if(existedUser){
        throw new ApiError(409,"Email or username already exists");
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImagePath = req.files?.coverImage[0].path;

    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar is required");
    }
    
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImagePath);

    if(!avatar){
        throw new ApiError(500,"Failed to upload avatar to cloudinary");
    }
    
    const user = await User.create({
        fullName,
        email,
        username : username.toLowerCase(),
        password,
        avatar:avatar.url,
        coverImage: coverImage?.url || "",
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )
    if(!createdUser){
        throw new ApiError(500,"Failed to create user");
    }

    return res.status(201).json(
        new ApiResponse(200,createdUser,"User created successfully")
    )
    

})


export {registerUser};