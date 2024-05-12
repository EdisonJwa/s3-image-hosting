"use client";
import { Session } from "inspector";
import { SessionProvider, useSession, signIn, signOut } from "next-auth/react";

import { useState } from "react";

function PageData() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [signinLoading, setSigninLoading] = useState(false);
  const { data: session, status } = useSession();
  const [url, setUrl] = useState<string>("");
  const [uploadDone, setUploadDone] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>("");
  const [errorDev, setErrorDev] = useState({});
  const [noFile, setNoFile] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setUploadDone(false);
    setUploadStatus("");
    setErrorDev({});
    setNoFile(false);
    setUrl("");
    if (!file) {
      setNoFile(true);
      return;
    }

    setUploading(true);

    const response = await fetch(
      process.env.NEXT_PUBLIC_BASE_URL + "/api/upload",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ filename: file.name, contentType: file.type }),
      }
    );

    if (response.ok) {
      const { url, fields, finalURI } = await response.json();


      const formData = new FormData();
      Object.entries(fields).forEach(([key, value]) => {
        formData.append(key, value as string);
      });
      formData.append("file", file);

      const uploadResponse = await fetch(url, {
        method: "POST",
        body: formData,
      });

      if (uploadResponse.ok) {
        setUrl(finalURI);
        console.log("Upload successful!", url);
        setFile(null);
        setUploadDone(true);
        setUploadStatus("success");
      } else {
        console.error("S3 Upload Error:", uploadResponse);
        setUploadDone(true);
        setFile(null);
        setUploadStatus("error");
        setErrorDev({ status: uploadResponse.status, message: uploadResponse.statusText } as any);
      }
    } else {
      setUploadDone(true);
      setFile(null);
      setUploadStatus("error");
      setErrorDev({ status: response.status, message: response.statusText, details: "Failed to get pre-signed URL." });
    }

    setUploading(false);
  };
  console.log("session", session);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center">
        <p>Loading...</p>
      </div>
    );
  } else if (!session || status === "unauthenticated") {
    return (
      <div className="hero min-h-screen">
        <div className="hero-body flex flex-col items-center justify-center text-center">
          <h1 className="title">Welcome to the Edison Network</h1>
          <p className="subtitle">You need to sign in to use this service.</p>
          <div className="flex items-center justify-center">
            <button
              onClick={() => {
                signIn("edison-network-sso");
                setSigninLoading(true);
              }}
              className={`button ${signinLoading ? "is-loading" : ""} `}
              disabled={signinLoading}
            >
              Sign in with Edison Network SSO
            </button>
          </div>
        </div>
        <div className="hero-foot p-4 bd-footer">
          <div className="content text-center">
            <p className="text-base">
              Copyright © 2015 - {new Date().getFullYear()} - Edison Network
            </p>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="hero min-h-screen">
      <div className="hero-body flex flex-col items-center justify-center space-y-2">
        <h1 className="title">Upload an image</h1>
        <form onSubmit={handleSubmit}>
          <div
            className="file has-name pr-4"
            style={{
              display: "inline-block",
            }}
          >
            <label className="file-label">
              <input
                className="file-input"
                name="resume"
                id="file"
                type="file"
                onChange={(e) => {
                  const files = e.target.files;
                  if (files) {
                    setFile(files[0]);
                  }
                }}
                accept="image/png, image/jpeg, image/gif, image/webp, image/svg+xml, image/heif, image/heic"
              />
              <span className="file-cta">
                <span
                  className="file-icon"
                  style={{
                    marginInlineEnd: "0rem",
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-6 h-6"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"
                    />
                  </svg>
                </span>
              </span>
              <span className="file-name">
                {file ? file.name : "Choose a file..."}
              </span>
            </label>
          </div>
          <button
            type="submit"
            className={`button ${uploading ? "is-loading" : ""}`}
            disabled={!file || uploading}
            style={{
              display: "inline-block",
            }}
          >
            Upload
          </button>
        </form>
        {noFile || uploadDone && (
          <article
            className={`message ${uploadStatus === "success"
                ? "is-success"
                : uploadStatus === "error"
                  ? "is-danger"
                  : "is-danger"
              }`}
            style={{
              width: "80%",
              maxWidth: "500px",

            }}
          >
            {uploadStatus === "success" && (
              <>
                <div className="message-header">
                  <p>Success</p>
                  <button
                    className="delete"
                    aria-label="delete"
                    onClick={() => setUploadDone(null)}

                  ></button>
                </div>
                <div className="message-body">
                  Link
                  <br />
                  <input
                    className="input"
                    type="text"
                    value={url}
                    onClick={(e) => {
                      const element = e.currentTarget;
                      navigator.clipboard.writeText(url);
                      e.currentTarget.classList.add("is-success");
                      e.currentTarget.classList.add("is-text-success");
                      e.currentTarget.classList.add("text-center");

                      e.currentTarget.value = "Copied!";
                      setTimeout(() => {
                        element.classList.remove("is-success"); // Remove the success class
                        element.classList.remove("is-text-success"); // Remove the success class
                        element.classList.remove("text-center"); // Remove the success class
                        element.value = url; // Restore the original button text
                      }, 500); // Delay before restoring the original state
                    }}
                    readOnly
                  />
                </div>
              </>
            )}
            {uploadStatus === "error" && (
              <>
                <div className="message-header">
                  <p>Upload Failed</p>
                  <button
                    className="delete"
                    aria-label="delete"
                    onClick={() => setUploadDone(null)}

                  ></button>
                </div>
                <div className="message-body">
                  Please try again later. <br />
                  If the problem persists, please contact Edison with the following error code:
                  <br />
                  <textarea
                    className="textarea"
                    value={JSON.stringify(errorDev, null, 2)}
                    onClick={(e) => {
                      const element = e.currentTarget;
                      navigator.clipboard.writeText(JSON.stringify(errorDev, null, 2));
                      e.currentTarget.classList.add("is-danger");
                      e.currentTarget.classList.add("is-text-danger");
                      e.currentTarget.classList.add("text-center");

                      e.currentTarget.value = "Copied!";
                      setTimeout(() => {
                        element.classList.remove("is-danger"); // Remove the success class
                        element.classList.remove("is-text-danger"); // Remove the success class
                        element.classList.remove("text-center"); // Remove the success class
                        element.value = JSON.stringify(errorDev, null, 2); // Restore the original button text
                      }, 500); // Delay before restoring the original state
                    }}
                    readOnly
                  />
                </div>
              </>
            )}
            {noFile && (
              <>
                <div className="message-header">
                  <p>Please select a file</p>
                  <button
                    className="delete"
                    aria-label="delete"
                    onClick={() => setNoFile(false)}

                  ></button>
                </div>
                <div className="message-body">
                  Please select a file to upload.

                </div>
              </>
            )}
          </article>
        )}

        <p>
          Logged in as {session.user.name}.{" "}
          <button className="button is-small" onClick={() => signOut()}>
            Sign out?
          </button>
        </p>
      </div>
      <div className="hero-foot p-4">
        <div className="content text-center">
          <p className="text-base">
            Copyright © 2015 - {new Date().getFullYear()} - Edison Network
          </p>
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <SessionProvider>
      <main>
        <PageData />
      </main>
    </SessionProvider>
  );
}

