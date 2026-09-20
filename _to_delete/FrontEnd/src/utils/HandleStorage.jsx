export const setItem = (key, value) => {
  if (getItem(key) === null) {
    localStorage.setItem(key, value);
    return;
  }
  removeItem(key);
  localStorage.setItem(key, value);
};

export const getItem = (key) => {
  return localStorage.getItem(key) || null;
};

export const removeItem = (key) => {
  localStorage.removeItem(key);
};

export const setUser = (data) => {
  localStorage.setItem("user", JSON.stringify(data));
};

export const getUser = () => {
  try {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  } catch (error) {
    console.error("Error parsing user data from localStorage:", error);
    return null;
  }
};
