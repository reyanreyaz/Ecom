import { create } from 'zustand'
import axiosInstance from "../lib/axios"
import axios from 'axios'
import { toast } from "react-hot-toast"

type User = {
    _id: string;
    name: string;
    email: string;
    role: string
  };

type UserStore = {
    user: User | null
    loading: boolean
    checkingAuth: boolean
    signup: (formData: {
      name: string;
      email: string;
      password: string;
      confirmPassword: string;
    }) => void;
    login: (
      email: string,
      password: string
    ) => void
    checkAuth: ()=> void
    logout: ()=> void
    refreshToken: () => Promise<void>
  };

export const useUserStore = create<UserStore>((set, get)=>({
    user: null,
    loading: false,
    checkingAuth: true,

    signup: async ({name, email, password, confirmPassword}) => {
        set({loading: true})

        if (password !== confirmPassword) {
            set({loading: false})
            return toast.error("Passwords do not match")
        }

        try {
            const res = await axiosInstance.post("/auth/signup", {name, email, password})
            set({user: res.data, loading: false})
        } catch (error) {
            set({loading: false})
            if (axios.isAxiosError(error)) {
              toast.error(error.response?.data?.message || "An error occurred");
            } else {
              toast.error("An unexpected error occurred");
            }
        }
    },

    login: async (email, password) => {
      set({loading: true})
      try {
        const res = await axiosInstance.post("/auth/login", {email, password})
        set({ user: res.data, loading: false})
      } catch (error) {
        set({loading: false})
        if (axios.isAxiosError(error)) {
          toast.error(error.response?.data?.message || "An error occurred");
        } else {
          toast.error("An unexpected error occurred");
        }
      }
    },
    logout: async () => {
      try {
        await axiosInstance.post("/auth/logout")
        set({user: null})
      } catch (error) {
        if (axios.isAxiosError(error)) {
          toast.error(error.response?.data?.message || "An error occurred");
        } else {
          toast.error("An unexpected error occurred");
        }
      }
    },
    checkAuth: async () => {
      set({ checkingAuth: true });
      try {
        const response = await axiosInstance.get("/auth/profile");
        set({ user: response.data, checkingAuth: false });
      } catch (error) {
        if (axios.isAxiosError(error)) {
          console.log(error.message)
        } else {
          console.log(error)
        }
        set({ checkingAuth: false, user: null });
      }
    },
    refreshToken: async () => {
      if (get().checkingAuth) return;
  
      set({ checkingAuth: true });
      try {
        const response = await axiosInstance.post("/auth/refresh-token");
        set({ checkingAuth: false });
        return response.data;
      } catch (error) {
        set({ user: null, checkingAuth: false });
        throw error;
      }
    },
}))

let refreshPromise: Promise<void> | null = null;

console.log("refreshPromise: ",refreshPromise)

axiosInstance.interceptors.response.use(
	(response) => response,
	async (error) => {
		const originalRequest = error.config;
		if (error.response?.status === 401 && !originalRequest._retry) {
			originalRequest._retry = true;

			try {
				if (refreshPromise) {
					await refreshPromise;
					return axiosInstance(originalRequest);
				}

				refreshPromise = useUserStore.getState().refreshToken();
				await refreshPromise;
				refreshPromise = null;

        originalRequest.withCredentials = true
				return axiosInstance(originalRequest);
			} catch (refreshError) {
				useUserStore.getState().logout();
				return Promise.reject(refreshError);
			}
		}
		return Promise.reject(error);
	}
);