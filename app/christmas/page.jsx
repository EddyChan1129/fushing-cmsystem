"use client";
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// 初始化 Supabase 客戶端
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function Home() {
  const [products, setProducts] = useState([]);
  const [editIndex, setEditIndex] = useState(null);
  const [formData, setFormData] = useState({  price: '' });

  // 載入數據
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('fushing') // 確保表名正確
        .select('id, price');

      if (error) throw error;
      setProducts(data);
    } catch (error) {
      console.error('Error fetching data:', error.message);
    }
  };

  const handleEdit = (index) => {
    setEditIndex(index);
    setFormData({
      price: products[index].price,
    });
  };

  const handleSave = async (id) => {
    try {
      const { error } = await supabase
        .from('fushing')
        .update({ price: formData.price })
        .eq('id', id);

      if (error) throw error;

      // 更新後刷新數據
      fetchProducts();
      setEditIndex(null);
    } catch (error) {
      console.error('Error updating product:', error.message);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  return (
    <div>
      <h1>Product List</h1>
      {products.map((product, index) => (
        <div key={product.id} style={{ marginBottom: '1rem' }}>
          {editIndex === index ? (
            <>

              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
              />
              <button onClick={() => handleSave(product.id)}>Save</button>
              <button onClick={() => setEditIndex(null)}>Cancel</button>
            </>
          ) : (
            <>
              <p>Price: ${product.price}</p>
              <button onClick={() => handleEdit(index)}>Edit</button>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
