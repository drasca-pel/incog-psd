import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";

import { auth } from "../firebase/firebase";
import Input from "../components/Input";
import Button from "../components/Button";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e) {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/dashboard");
    } catch (err) {
      switch (err.code) {
        case "auth/invalid-credential":
          setError("Incorrect email or password.");
          break;

        case "auth/user-not-found":
          setError("Account not found.");
          break;

        case "auth/too-many-requests":
          setError("Too many attempts. Try again later.");
          break;

        default:
          setError(err.message);
      }
    }

    setLoading(false);
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>

        <h1 style={styles.logo}>INCOG</h1>

        <p style={styles.subtitle}>
          Collaborate. Build. Innovate.
        </p>

        {error && (
          <div style={styles.error}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>

          <Input
            label="Email"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e)=>setEmail(e.target.value)}
            required
          />

          <div style={{height:15}}/>

          <Input
            label="Password"
            type={showPassword ? "text" : "password"}
            placeholder="Enter your password"
            value={password}
            onChange={(e)=>setPassword(e.target.value)}
            required
          />

          <div style={styles.options}>
            <label>
              <input
                type="checkbox"
                onChange={()=>setShowPassword(!showPassword)}
              />
              Show Password
            </label>

            <Link to="/forgot-password" style={styles.link}>
              Forgot?
            </Link>
          </div>

          <Button
            type="submit"
            disabled={loading}
          >
            {loading ? "Signing In..." : "Login"}
          </Button>

        </form>

        <div style={styles.divider}>
          OR
        </div>

        <Button
          variant="secondary"
          onClick={()=>navigate("/register")}
        >
          Create Account
        </Button>

      </div>
    </div>
  );
}

const styles={

page:{
minHeight:"100vh",
display:"flex",
justifyContent:"center",
alignItems:"center",
background:"#0B1120",
padding:"20px"
},

card:{
width:"100%",
maxWidth:"420px",
background:"#111827",
padding:"35px",
borderRadius:"15px",
border:"1px solid #1F2937"
},

logo:{
textAlign:"center",
fontSize:"40px",
color:"#38BDF8",
marginBottom:"10px"
},

subtitle:{
textAlign:"center",
color:"#94A3B8",
marginBottom:"25px"
},

options:{
display:"flex",
justifyContent:"space-between",
alignItems:"center",
margin:"15px 0 20px"
},

divider:{
textAlign:"center",
margin:"20px 0",
color:"#64748B"
},

link:{
color:"#38BDF8",
textDecoration:"none"
},

error:{
background:"#7F1D1D",
padding:"10px",
borderRadius:"8px",
color:"#FECACA",
marginBottom:"20px"
}

};