"use client";
import { useState } from "react";
import S3 from "react-aws-s3-typescript";
import { createClient } from "@supabase/supabase-js";

export default function Home() {
  const getSupabase = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY;
    return createClient(supabaseUrl, supabaseKey);
  };

  const [uploadedImageUrls, setUploadedImageUrls] = useState([]);
  const [imageInputs, setImageInputs] = useState([0]); // 用來動態新增file input的狀態
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    price: "",
    width: "",
    height: "",
    desc: "",
    product_type: [],
  });

  const handleImage = (e, index) => {
    const file = e.target.files[0];
    handleUpload(file, index); // 傳遞 file 和 index
  };

  const handleUpload = async (file, index) => {
    if (!file) {
      console.error("No file selected for upload");
      return;
    }
    try {
      setLoading(true);
      const response = await ReactS3Client.uploadFile(file);
      console.log("Uploaded Image Data:", response);
      setLoading(false);
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
      product_type: form.product_type.length === 0 ? ["-"] : form.product_type, // 如果為空，設為 ["-"]
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
      window.location.reload();
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const addImageInput = () => {
    setImageInputs((prev) => [...prev, prev.length]); // 新增一個 input 的 index
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
      <h1 className="text-3xl font-bold text-center text-blue-600 mb-8">
        上傳聖誕產品
      </h1>

      {/* Form Section */}
      <form
        className="bg-white shadow-lg rounded-lg p-6 max-w-lg mx-auto mb-10"
        onSubmit={handleSubmit}
      >
        <h2 className="text-2xl font-semibold mb-4 text-gray-700">新增產品</h2>
        {/* Other form fields */}
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
          <label className="block text-gray-600 font-medium mb-2">價錢</label>
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
          <label className="block text-gray-600 font-medium mb-2">寬度</label>
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
          <label className="block text-gray-600 font-medium mb-2">高度</label>
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
          <label className="block text-gray-600 font-medium mb-2">種類</label>
          <select
            name="product_type"
            onChange={(e) => {
              const value = e.target.value;
              setForm((prevForm) => {
                let { product_type } = prevForm;

                // 如果 product_type 包含 '-'，則移除它
                if (product_type.includes("-")) {
                  product_type = product_type.filter((type) => type !== "-");
                }

                // Append the value if it's not already in the array
                if (!product_type.includes(value)) {
                  return {
                    ...prevForm,
                    product_type: [...product_type, value],
                  };
                }
                return prevForm; // No changes if value already exists
              });
            }}
            className="w-full border border-gray-300 rounded-lg p-2 text-black"
          >
            <option disabled>請選擇種類</option>
            <option value="其他" checked>
              其他
            </option>
            <option value="聖誕樹">聖誕樹</option>
            <option value="掛件">掛件</option>
            <option value="窗貼">窗貼 </option>
            <option value="燈飾">燈飾 </option>
            <option value="大型擺設">大型擺設 </option>
          </select>

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
                      {type}{" "}
                      <i
                        className="bg-red-500 text-white pl-1 pr-2 py-0 text-sm rounded-lg shadow-md"
                        onClick={() => handleRemoveType(index)}
                      >
                        ✖
                      </i>
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
          <div key={index} className="mb-4 flex items-center  justify-between">
            <input
              type="file"
              onChange={(e) => handleImage(e, index)}
              className="block w-fit text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 "
            />
            {uploadedImageUrls[index] && (
              <p className="text-green-600 ">已上傳圖片</p>
            )}
          </div>
        ))}
        {/* show uploaded images */}
        {uploadedImageUrls.length > 0 && (
          <div className="flex flex-wrap">
            {uploadedImageUrls.map((url, index) => (
              <img
                key={index}
                src={url}
                alt="uploaded image"
                className="w-20 h-20 object-cover rounded-md mr-2"
              />
            ))}
          </div>
        )}
        <div className="flex flex-col gap-5">
          <button
            type="button"
            onClick={addImageInput}
            disabled={uploadedImageUrls.length !== imageInputs.length} // 按鈕狀態取決於上傳進度
            className={`bg-blue-500 text-white px-4 mt-4 py-2 rounded-md w-fit ${
              uploadedImageUrls.length !== imageInputs.length
                ? "opacity-50 cursor-not-allowed"
                : "hover:bg-blue-600"
            }`}
          >
            新增更多圖片
          </button>

          {/* Submit button */}
          <button
            type="submit"
            disabled={
              loading || uploadedImageUrls.length !== imageInputs.length
            } // 判斷條件
            className={`bg-green-500 text-white px-4 py-2 rounded-md ${
              loading || uploadedImageUrls.length !== imageInputs.length
                ? "opacity-50 cursor-not-allowed"
                : "hover:bg-green-600"
            }`}
          >
            {loading
              ? "上傳中..."
              : uploadedImageUrls.length !== imageInputs.length
                ? "請先上傳所有圖片"
                : "上傳產品"}
          </button>
        </div>
      </form>
    </div>
  );
}
