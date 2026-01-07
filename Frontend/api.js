export async function api(path, options = {}) {
  return fetch(`http://localhost:8000${path}`, {
    credentials: "include",   // VERY IMPORTANT
    ...options
  });
}

// export async function api(path, options = {}) {
//   const baseUrl = "http://localhost:8000";  // FastAPI server
//   return fetch(`${baseUrl}${path}`, options);
// }
