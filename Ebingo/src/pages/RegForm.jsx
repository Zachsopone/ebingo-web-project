import { useState } from "react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_BASE_URL;

const RegForm = () => {
  const [values, setValues] = useState({
    Username: "",
    Password: "",
  });

  const handleSubmit = (event) => {
    event.preventDefault();
    axios
      .post(`${API_URL}/regform`, values)
      .then((response) => console.log(response))
      .catch((error) => console.log(error));
    console.log("this is the ", values);
  };

  return (
    <div className="w-full h-screen flex justify-center items-center bg-[#F2F0EA]">
      <form
        className="flex flex-col justify-evenly border border-black w-1/4 h-2/5 rounded-xl bg-[#A8D5E3]"
        onSubmit={handleSubmit}
      >
        <label className="mx-4">Username</label>
        <input
          className="outline-none border mx-4 p-2 border-black rounded-md bg-transparent"
          type="text"
          required
          onChange={(e) => setValues({ ...values, Username: e.target.value })}
        />
        <label className="mx-4">Password</label>
        <input
          className="outline-none border mx-4 p-2 border-black rounded-md bg-transparent"
          type="password"
          required
          onChange={(e) => setValues({ ...values, Password: e.target.value })}
        />
        <button
          type="submit"
          onClick={() => handleSubmit}
          className="text-[#212121] hover:text-[#f5f5f5] p-2 rounded-md border border-[#212121] hover:bg-[#212121]
            duration-300 m-4"
        >
          Register
        </button>
      </form>
    </div>
  );
};

export default RegForm;
