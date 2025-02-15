import axios from "axios";

const setupAxiosInterceptors = () => {
  axios.interceptors.response.use(
    (response) => response,
    (error) => {
      // const { status } = error.response;
      

      // if (status === 401 || status == 403) {
      //   // setAccount(null);
      //   // localStorage.removeItem('wallet');
      //   // window.location.href = "/login";
      // }

      return Promise.reject(error);
    }
  );
};

export default setupAxiosInterceptors;
