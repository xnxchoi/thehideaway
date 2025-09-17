"use server"
import {PayloadHandler} from "payload";
import {queryAuthorOverview} from "@collections/Posts/api/queryPostOverview";

export const userOverviewHandler: PayloadHandler = async (req) => {
	const para=req.routeParams;
	if(!para){
		return Response.json({error: "no route parameters available"}, {status: 400});
	}
	const userId=para.id;
	if(!userId||typeof userId !== "string"){
		return Response.json({error: "no valid user id provided"}, {status: 400});
	}
	const res=await queryAuthorOverview(userId);
	if(res){
		return Response.json({data:res}, {status: 200});
	}
	return Response.json({error: "no data found"}, {status: 404});
}
