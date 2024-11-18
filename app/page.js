"use client";
import { useState, useEffect } from "react";
import S3 from "react-aws-s3-typescript";
import { createClient } from "@supabase/supabase-js";

export default function Home() {
  const getSupabase = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY;
    return createClient(supabaseUrl, supabaseKey);
  };

  const [uploadedImageUrl, setUploadedImageUrl] = useState("");

  const [form, setForm] = useState({
    price: "",
    width: "",
    height: "",
    desc: "",
  });

  const handleImage = (e) => {
    const file = e.target.files[0];
    handleUpload(file); // Pass the file directly to handleUpload
  };

  const handleUpload = async (file) => {
    if (!file) {
      console.error("No file selected for upload");
      return;
    }
    try {
      const response = await ReactS3Client.uploadFile(file);
      console.log("Uploaded Image Data:", response);
      setUploadedImageUrl(response.location); // Save the uploaded image URL
    } catch (err) {
      console.error("Error uploading file:", err);
    }
  };

  const ReactS3Client = new S3({
    accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY,
    bucketName: process.env.NEXT_PUBLIC_AWS_BUCKET,
    dirName: "uploads/newdir",
    region: "ap-southeast-1",
    S3Url: "https://christmasp.s3.ap-southeast-1.amazonaws.com",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!uploadedImageUrl) {
      console.error("Please upload an image before submitting");
      return;
    }

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("fushing")
      .insert([{ ...form, image: uploadedImageUrl }]);

    if (error) {
      console.error("Error inserting data:", error);
    } else {
      console.log("Data inserted successfully:", data);
      setForm({ price: "", width: "", height: "", desc: "" }); // Reset form
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  return (
    <div className="bg-gray-100 min-h-screen py-10 px-5">
      <h1 className="text-3xl font-bold text-center text-blue-600 mb-8">
        Image Upload and Supabase Form
      </h1>

      {/* Form Section */}
      <form
        className="bg-white shadow-lg rounded-lg p-6 max-w-lg mx-auto mb-10"
        onSubmit={handleSubmit}
      >
        <h2 className="text-2xl font-semibold mb-4 text-gray-700">
          Add New Item
        </h2>
        <div className="mb-4">
          <label className="block text-gray-600 font-medium mb-2">
            Price (Integer)
          </label>
          <input
            type="number"
            name="price"
            value={form.price}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg p-2"
            placeholder="Enter price"
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-600 font-medium mb-2">
            Width (Integer)
          </label>
          <input
            type="number"
            name="width"
            value={form.width}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg p-2"
            placeholder="Enter width"
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-600 font-medium mb-2">
            Height (Integer)
          </label>
          <input
            type="number"
            name="height"
            value={form.height}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg p-2"
            placeholder="Enter height"
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-600 font-medium mb-2">
            Description
          </label>
          <textarea
            name="desc"
            value={form.desc}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg p-2"
            placeholder="Enter description"
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-600 font-medium mb-2">Image</label>
          <input
            type="file"
            onChange={handleImage}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          {uploadedImageUrl && (
            <p className="text-green-600 mt-2">Image uploaded successfully!</p>
          )}
        </div>
        <button
          type="submit"
          className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
        >
          Submit
        </button>
      </form>
    </div>
  );
}
