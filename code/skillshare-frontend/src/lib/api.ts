// src/lib/api.ts

const BASE_URL = "http://localhost:5173"; //backend server address

const getHeaders = (): HeadersInit => {
    const token = localStorage.getItem("token");

    return {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
};

const request = async <T = any>(
    url: string,
    options: RequestInit = {}
): Promise<T> => {
    //real request
    const response = await fetch(`${BASE_URL}${url}`, {
        ...options,
        headers: {
            ...getHeaders(),
            ...(options.headers || {}),
        },
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Request failed with status ${response.status}`);
    }

    if (response.status === 204) {
        return null as T;
    }

    return response.json();
};

const api = {
    get: <T = any>(url: string) =>
        request<T>(url, {
            method: "GET",
        }),

    post: <T = any>(url: string, data: any) =>
        request<T>(url, {
            method: "POST",
            body: JSON.stringify(data),
        }),

    put: <T = any>(url: string, data: any) =>
        request<T>(url, {
            method: "PUT",
            body: JSON.stringify(data),
        }),

    delete: <T = any>(url: string) =>
        request<T>(url, {
            method: "DELETE",
        }),
};

export default api;