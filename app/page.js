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
  const [isRemoveImage, setIsRemoveImage] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  const [form, setForm] = useState({
    name: "",
    price: "",
    width: "",
    height: "",
    desc: "",
    product_type: [],
  });

  useEffect(() => {
    if (imageInputs.length > 0) {
      // 獲取最新的 input id
      const newIndex = imageInputs.length - 1;
      const newInput = document.getElementById(`gg${newIndex}`);
      if (newInput) {
        newInput.click(); // 點擊最新添加的 input
      }
    }
  }, [isRemoveImage]); // 當 imageInputs 更新時觸發

  const handleImage = (e, index) => {
    const files = Array.from(e.target.files); // 獲取所有選中的文件
    files.forEach((file, fileIndex) => {
      handleUpload(file, index + fileIndex); // 傳遞文件和正確的索引
    });
  };

  const handleUpload = async (file, index) => {
    if (!file) {
      console.log("No file selected for upload");
      return;
    }
    try {
      setLoading(true);
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

      setLoading(false);
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
    // 將需要的字段轉換為整數
    const formattedForm = {
      ...form,
      price: parseInt(form.price, 10) || null, // 如果為空，默認為 null
      width: parseInt(form.width, 10) || null,
      height: parseInt(form.height, 10) || null,
      product_type: form.product_type.length === 0 ? [""] : form.product_type, // 如果為空，設為 ["-"]
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
        product_type: [],
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
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const addImageInput = (index) => {
    setImageInputs((prev) => [...prev, ...new Array(1).fill(prev.length)]); // 新增一個新的 input
  };

  const handleRemoveType = (index) => {
    setForm((prevForm) => {
      const updatedProductTypes = [...prevForm.product_type];
      updatedProductTypes.splice(index, 1); // Remove the item at the given index
      return { ...prevForm, product_type: updatedProductTypes };
    });
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
            type="number"
            name="price"
            value={form.price}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg p-2 text-black"
            placeholder="輸入價錢"
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-600 font-medium mb-2">
            寬度 (CM)
          </label>
          <input
            type="number"
            name="width"
            value={form.width}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg p-2 text-black"
            placeholder="輸入寬度"
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-600 font-medium mb-2">
            高度 (CM)
          </label>
          <input
            type="number"
            name="height"
            value={form.height}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg p-2 text-black"
            placeholder="輸入高度"
          />
        </div>

        <div className="mb-4">
          <div className="flex gap-1 items-center flex-wrap ">
            <p className="text-gray-700">請選擇種類：</p>
            <div className="flex items-center gap-2  w-full flex-wrap">
              {["其他", "聖誕樹", "掛件", "窗貼", "燈飾", "大型擺設"].map(
                (type) => (
                  <label key={type} className=" text-gray-500 flex gap-1">
                    <input
                      type="checkbox"
                      value={type}
                      onChange={(e) => {
                        const value = e.target.value;
                        setForm((prevForm) => {
                          const { product_type } = prevForm;
                          // 如果勾選，新增到陣列；取消勾選，從陣列移除
                          if (e.target.checked) {
                            return {
                              ...prevForm,
                              product_type: [...product_type, value],
                            };
                          } else {
                            return {
                              ...prevForm,
                              product_type: product_type.filter(
                                (item) => item !== value,
                              ),
                            };
                          }
                        });
                      }}
                      checked={form.product_type.includes(type)}
                    />
                    {type}
                  </label>
                ),
              )}
            </div>
          </div>

          {/* Show selected product types */}
          <div className="mt-2">
            {form.product_type.length > 0 && (
              <div className="text-gray-700 py-3 relative">
                <b>已選種類:</b>
                <br />
                <div>
                  {form.product_type.map((type, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between"
                    >
                      {type}
                      {""}
                      <span
                        style={{ color: "white" }}
                        className="bg-blue-500 px-1.5 py-0 text-sm rounded-full shadow-md cursor-pointer"
                        onClick={() => handleRemoveType(index)}
                      >
                        x
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
              htmlFor={isPressed ? undefined : `gg${index}`}
              className={`bg-blue-500 text-white px-4 py-2 rounded-md w-fit  hover:bg-blue-100 ${
                uploadedImageUrls[index] ? "hidden" : ""
              }  ${
                isPressed
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:bg-green-600"
              }`}
            >
              {isPressed ? <>壓縮圖片中...請不要離開視窗</> : "上傳圖片"}
            </label>
            <input
              type="file"
              multiple
              id={`gg${index}`}
              onChange={(e) => handleImage(e, index)}
              className={`hidden ${
                isPressed
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:bg-green-600"
              }`} // 隱藏原始 input
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
            {loading ? "上傳中..." : "上傳產品"}
          </button>
        </div>
      </form>
    </div>
  );
}
