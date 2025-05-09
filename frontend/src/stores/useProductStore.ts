import { create } from "zustand";
import toast from "react-hot-toast";
import axiosInstance from "../lib/axios";
import axios from "axios";

type Product = {
    _id: string;
    name: string;
    description: string;
    price: number;
    category: string;
    image: string;
    isFeatured: boolean
  };
  
  type ProductStore = {
    products: Product[];
    loading: boolean;
    error: string | null
    setProducts: (products: Product[]) => void;
    createProduct: (productData: Omit<Product, "_id">) => Promise<void>;
    fetchProductsByCategory: (category: string | undefined) => Promise<void>;
    deleteProduct: (productId: string) => Promise<void>
    toggleFeaturedProduct: (productId: string) => Promise<void>
    fetchFeaturedProducts: () => Promise<void>
    fetchAllProducts: () => Promise<void>
  };
  

export const useProductStore = create<ProductStore>((set) => ({
	products: [],
	loading: false,
    error: null,

	setProducts: (products) => set({ products }),
	createProduct: async (productData) => {
		set({ loading: true });
		try {
			const res = await axiosInstance.post("/products", productData);
			set((prevState) => ({
				products: [...prevState.products, res.data],
				loading: false,
			}));
		} catch (error) {
			if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.message || "An error occurred");
              } else {
                toast.error("An unexpected error occurred");
              }
			set({ loading: false });
		}
	},
    fetchAllProducts: async () => {
		set({ loading: true });
		try {
			const response = await axiosInstance.get("/products");
			set({ products: response.data.products, loading: false });
		} catch (error) {
            set({ error: "Failed to fetch products", loading: false });
            if (axios.isAxiosError(error)){
			toast.error(error.response?.data?.error || "Failed to fetch products");
            } else {
                toast.error("An unexpected error occurred");
            }
		}
	},
	fetchProductsByCategory: async (category) => {
		set({ loading: true });
		try {
			const response = await axiosInstance.get(`/products/category/${category}`);
			set({ products: response.data.products, loading: false });
		} catch (error) {
			set({ error: "Failed to fetch products", loading: false });
            if (axios.isAxiosError(error)){
			toast.error(error.response?.data?.error || "Failed to fetch products");
            } else {
                toast.error("An unexpected error occurred");
            }
		}
	},
	deleteProduct: async (productId) => {
		set({ loading: true });
		try {
			await axiosInstance.delete(`/products/${productId}`);
			set((prevProducts) => ({
				products: prevProducts.products.filter((product) => product._id !== productId),
				loading: false,
			}));
		} catch (error) {
			set({ error: "Failed to delete product", loading: false });
            if (axios.isAxiosError(error)){
			toast.error(error.response?.data?.error || "Failed to delete product");
            } else {
                toast.error("An unexpected error occurred");
            }
		}
	},
	toggleFeaturedProduct: async (productId) => {
		set({ loading: true });
		try {
			const response = await axiosInstance.patch(`/products/${productId}`);
			set((prevProducts) => ({
				products: prevProducts.products.map((product) =>
					product._id === productId ? { ...product, isFeatured: response.data.isFeatured } : product
				),
				loading: false,
			}));
		} catch (error) {
			set({ error: "Failed to update product", loading: false });
            if (axios.isAxiosError(error)){
			toast.error(error.response?.data?.error || "Failed to update product");
            } else {
                toast.error("An unexpected error occurred");
            }
		}
	},
	fetchFeaturedProducts: async () => {
		set({ loading: true });
		try {
			const response = await axiosInstance.get("/products/featured");
			set({ products: response.data, loading: false });
		} catch (error) {
			set({ error: "Failed to fetch products", loading: false });
			console.log("Error fetching featured products:", error);
		}
	},
}));