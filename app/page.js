"use client";
import { useState, useEffect } from "react";
import S3 from "react-aws-s3-typescript";
import { createClient } from "@supabase/supabase-js";
import { Toaster, toast } from "sonner";
import imageCompression from "browser-image-compression";

export default function Home() {
  const getSupabase = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY;
    return createClient(supabaseUrl, supabaseKey);
  };

  const [uploadedImageUrls, setUploadedImageUrls] = useState([]);
  const [imageInputs, setImageInputs] = useState([0]); // 用來動態新增file input的狀態
  const [loading, setLoading] = useState(false);
  const [unit, setUnit] = useState("米");

  const [form, setForm] = useState({
    name: "",
    price: "",
    width: "",
    height: "",
    desc: "",
    product_type: "其他",
  });

  const handleImage = async (e, index) => {
    const files = Array.from(e.target.files); // 获取所有选中的文件
    setLoading(true);

    // 使用map构建所有上传任务的Promise数组
    const uploadPromises = files.map(
      (file, fileIndex) => handleUpload(file, index + fileIndex), // 调用上传函数并传递索引
    );

    // 等待所有上传任务完成
    await Promise.all(uploadPromises);

    // 所有上传完成后再设置loading为false
    setLoading(false);
  };

  const handleUpload = async (file, index) => {
    if (!file) {
      console.log("No file selected for upload");
      return;
    }
    try {
      // 壓縮圖片
      const pressedFile = await imageCompression(file, {
        // 壓縮參數
        maxSizeMB: 0.1,
        useWebWorker: true,
      });

      const response = await ReactS3Client.uploadFile(pressedFile);
      console.log("Uploaded Image Data:", response);
      setUploadedImageUrls((prevUrls) => {
        const updatedUrls = [...prevUrls];
        updatedUrls[index] = response.location; // 更新對應 index 的 URL
        return updatedUrls;
      });
    } catch (err) {
      console.error("Error uploading file:", err);
    }
  };

  const ReactS3Client = new S3({
    accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY,
    bucketName: process.env.NEXT_PUBLIC_AWS_BUCKET,
    region: "ap-southeast-1",
    S3Url: "https://christmasp.s3.ap-southeast-1.amazonaws.com",
  });

  const handleRemoveImage = (index) => {
    setUploadedImageUrls((prevUrls) => {
      const updatedUrls = [...prevUrls];
      updatedUrls.splice(index, 1); // Remove the item at the given index
      return updatedUrls;
    });

    setImageInputs((prev) => {
      const updatedInputs = [...prev];
      updatedInputs.splice(index, 1); // Remove the item at the given index

      if (updatedInputs.length === 0) {
        updatedInputs.push(0); // 當沒有 input 時，新增一個 input
        document.querySelector("input[type=file]").value = "";
      }

      return updatedInputs;
    });

    const fileUrl = uploadedImageUrls[index];
    const fileName = fileUrl.split("/").pop();

    ReactS3Client.deleteFile(fileName);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    /*   if (!uploadedImageUrls.length) {
        console.error("Please upload at least one image before submitting");
        return;
      } */
    // form width and height add unit
    const formattedForm = {
      ...form,
      width: form.width ? `${form.width}(${unit})` : "",
      height: form.height ? `${form.height}(${unit})` : "",
    };

    const supabase = getSupabase();
    setLoading(true);
    const { data, error } = await supabase
      .from("fushing")
      .insert([{ ...formattedForm, image: uploadedImageUrls }]);

    if (error) {
      console.error("Error inserting data:", error);
    } else {
      console.log("Data inserted successfully:", data);
      setForm({
        name: "",
        price: "",
        width: "",
        height: "",
        product_type: "其他",
        desc: "",
      }); // Reset form
      setUploadedImageUrls([]); // Reset images
      setImageInputs([0]); // Reset input rows
      setLoading(false);
      // input file reset to empty
      document.querySelector("input[type=file]").value = "";

      toast.success("產品上傳成功", {
        position: "top-center",
        duration: 5000,
        style: {
          backgroundColor: "#10B981",
          color: "white",
          textAlign: "center",
        },
      });
    }
  };

  const handleChange = (e) => {
    // if e.target.name is price or width or height, confirm the string is contain number or "." only else add unit to the string
    if (
      ["price", "width", "height"].includes(e.target.name) &&
      !/^\d*\.?\d*$/.test(e.target.value)
    ) {
      return;
    }

    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const addImageInput = (index) => {
    setImageInputs((prev) => [...prev, ...new Array(1).fill(prev.length)]); // 新增一個新的 input
  };

  return (
    <div className="bg-gray-100 min-h-screen py-10 px-5">
      <Toaster />
      <h1 className="text-3xl font-bold text-center text-blue-600 mb-8">
        新增聖誕產品
      </h1>

      {/* Form Section */}
      <form
        className="bg-white shadow-lg rounded-lg p-6 max-w-lg mx-auto mb-10"
        onSubmit={handleSubmit}
      >
        <div className="mb-4">
          <label className="block text-gray-600 font-medium mb-2">
            產品名稱
          </label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg p-2 text-black"
            placeholder="輸入產品名稱"
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-600 font-medium mb-2">
            價錢 (HKD)
          </label>
          <input
            name="price"
            value={form.price}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg p-2 text-black"
            placeholder="輸入價錢"
          />
        </div>
        <div className="mb-4">
          <label className="text-gray-600 font-medium mb-2  flex justify-between">
            寬度 ({unit})
            <div className="flex gap-3">
              <div className="flex gap-1">
                <input
                  type="radio"
                  value="米"
                  name="unit"
                  onChange={(e) => setUnit(e.target.value)}
                  checked={unit === "米"}
                />
                米
              </div>
              <div className="flex gap-1">
                <input
                  type="radio"
                  value="厘米"
                  name="unit"
                  onChange={(e) => setUnit(e.target.value)}
                  checked={unit === "厘米"}
                />
                厘米
              </div>
              <div className="flex gap-1">
                <input
                  type="radio"
                  value="毫米"
                  name="unit"
                  onChange={(e) => setUnit(e.target.value)}
                  checked={unit === "毫米"}
                />
                毫米
              </div>
            </div>
          </label>

          <input
            name="width"
            value={form.width}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg p-2 text-black"
            placeholder="輸入寬度"
          />
        </div>
        <div className="mb-4">
          <label className=" text-gray-600 font-medium mb-2 flex justify-between">
            高度 ({unit})
            <div className="flex gap-3">
              <div className="flex gap-1">
                <input
                  type="radio"
                  value="米"
                  name="unit2"
                  onChange={(e) => setUnit(e.target.value)}
                  checked={unit === "米"}
                />
                米
              </div>
              <div className="flex gap-1">
                <input
                  type="radio"
                  value="厘米"
                  name="unit2"
                  onChange={(e) => setUnit(e.target.value)}
                  checked={unit === "厘米"}
                />
                厘米
              </div>
              <div className="flex gap-1">
                <input
                  type="radio"
                  value="毫米"
                  name="unit2"
                  onChange={(e) => setUnit(e.target.value)}
                  checked={unit === "毫米"}
                />
                毫米
              </div>
            </div>
          </label>
          <input
            name="height"
            value={form.height}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg p-2 text-black"
            placeholder="輸入高度"
          />
        </div>

        <div className="mb-4">
          <div className="flex gap-1 flex-wrap ">
            <p className="text-gray-700">請選擇種類：</p>
            <div className="flex gap-2  w-full flex-wrap">
              {["其他"].map((type) => (
                <label key={type} className=" text-gray-500 flex gap-2 w-full">
                  <input
                    type="radio"
                    value={type}
                    name="product_type"
                    onChange={handleChange}
                    checked={form.product_type === type}
                  />
                  {type}
                </label>
              ))}

              {[
                "聖誕樹",
                "聖誕樹吊飾",
                "聖誕服飾",
                "場景佈置",
                "掛飾",
                "窗貼",
                "燈飾",
                "小型擺設",
                "大型擺設",
              ].map((type) => (
                <label key={type} className=" text-gray-500 flex gap-2">
                  <input
                    type="radio"
                    value={type}
                    name="product_type"
                    onChange={handleChange}
                  />
                  {type}
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-gray-600 font-medium mb-2">
            產品描述
          </label>
          <textarea
            name="desc"
            value={form.desc}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg p-2 text-black"
            placeholder="輸入產品描述"
          />
        </div>
        {/* Image upload inputs */}
        {imageInputs.map((input, index) => (
          <div
            key={index}
            className={`mb-4 flex items-center justify-between ${index === imageInputs.length - 1 ? "" : "hidden"}`}
          >
            <label
              htmlFor={`gg${index}`}
              className={`bg-blue-500 text-white px-4 py-2 rounded-md w-fit  hover:bg-blue-100 ${
                uploadedImageUrls[index] ? "hidden" : ""
              }  `}
            >
              上傳圖片
            </label>
            <input
              type="file"
              multiple
              id={`gg${index}`}
              onChange={(e) => handleImage(e, index)}
              className={`hidden`} // 隱藏原始 input
            />
          </div>
        ))}
        {/* show uploaded images */}
        {uploadedImageUrls.length > 0 && (
          <div className="flex flex-wrap relative mb-4">
            {uploadedImageUrls.map((url, index) => (
              <div className="relative" key={index}>
                <img
                  key={index}
                  src={url}
                  alt="uploaded image"
                  className="w-20 h-20 object-cover rounded-md mr-2 mt-1"
                />
                <button
                  style={{ color: "white" }}
                  type="button"
                  onClick={() => {
                    handleRemoveImage(index);
                  }}
                  className="absolute top-[-0.5rem] right-0 bg-blue-500 px-1.5 py-0 text-sm rounded-full shadow-md" // 按鈕樣式
                >
                  x
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="flex flex-col gap-5">
          {/* Submit button */}
          <button
            type="submit"
            disabled={loading} // 判斷條件
            className={`bg-green-500 text-gray-100 px-4 py-2 rounded-md ${
              loading ? "opacity-50 cursor-not-allowed" : "hover:bg-green-600"
            }`}
          >
            {loading ? "處理圖片中..." : "上傳產品"}
          </button>
        </div>
      </form>
    </div>
  );
}
