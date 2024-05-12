import { createPresignedPost } from "@aws-sdk/s3-presigned-post";
import { S3Client } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";

import { useSession, getSession } from "next-auth/react";
import { getServerSession } from "next-auth/next"
import { authOptions } from "../auth/[...nextauth]/index";

export async function POST(request: Request) {
  const { filename, contentType } = await request.json();
  const session = await getServerSession();
  let ext = filename.split(".").pop();
  let newFilename = `${new Date()
    .toISOString()
    .slice(
      0,
      10
    )}-${new Date().getUTCHours()}-${new Date().getUTCMinutes()}-${makeid(
    5
  )}.${ext}`;
  if (!session || !session.user) {
    return Response.json({ error: "You need to be logged in to upload files", code: 401, session});
  }
  try {
    let finalURI = `${process.env.FINAL_URL}/${process.env.AWS_FILE_PATH}${newFilename}`;
    const client = new S3Client({ region: process.env.AWS_REGION });
    const { url, fields } = await createPresignedPost(client, {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: process.env.AWS_FILE_PATH + newFilename,
      Conditions: [
        ["content-length-range", 0, 20971520], // up to 20 MB
        ["starts-with", "$Content-Type", contentType],
      ],
      Fields: {
        acl: "public-read",
        "Content-Type": contentType,
      },
      Expires: 60, // Seconds before the presigned post expires. 3600 by default.
    });

    return Response.json({ url, fields, finalURI });
  } catch (error) {
    return Response.json({ error: error.message});
  }
}

function makeid(length: number) {
  let result = "";
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}
