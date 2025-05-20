import React, { useState } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';
import { toast } from 'react-toastify';

const WatchProductDemoForm = ({ onSubmit, onCancel, onAddBotMessage }) => {
  const [formData, setFormData] = useState({
    firstname: '',
    lastname: '',
    emailid: '',
    username: '',
    problem_statement: '',
    instance_to_assign: '8',
    mobilenumber: '',
    end_date: new Date().toISOString().split('T')[0],
    user_role: 'Guest',
    user_type: 'Demo User',
    assign_name: 'Team AI'
  });

  const [captchaToken, setCaptchaToken] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const recaptchaRef = React.createRef();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!captchaToken) {
      toast.error("Please complete the reCAPTCHA.", {
        position: "bottom-right",
      });
      setIsSubmitting(false);
      return;
    }

    // Create a copy of formData without captchaToken
    const submissionData = {
      firstname: formData.firstname,
      lastname: formData.lastname,
      emailid: formData.emailid,
      username: formData.username,
      problem_statement: formData.problem_statement,
      instance_to_assign: formData.instance_to_assign,
      mobilenumber: formData.mobilenumber,
      end_date: formData.end_date,
      user_role: formData.user_role,
      user_type: formData.user_type,
      assign_name: formData.assign_name
    };

    try {
      const response = await fetch('https://demoapi.techgenzi.com/demo_user/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submissionData)  // Use the filtered data here
      });
      
      console.log("Response from API:", response);
      if (!response.ok) {
        throw new Error("Submission failed");
      }

      const responseData = await response.json();  // Make sure to parse the JSON response
      localStorage.setItem('customerInfo', JSON.stringify(responseData));

      const successMessage = `Thank you ${formData.firstname}, we received your request. Our team will connect with you at ${formData.emailid}.`;
      onAddBotMessage?.({
        from: 'bot',
        text: successMessage,
        timestamp: new Date().toISOString(),
      });

      toast.success("Submission successful!", { position: "bottom-right" });
      onSubmit?.({ success: true, data: submissionData });

    } catch (err) {
      console.error(err);
      toast.error("Submission failed. Please try again later.", {
        position: "bottom-right",
      });

      onAddBotMessage?.({
        from: 'bot',
        text: `Oops! Something went wrong, ${formData.firstname}.`,
        timestamp: new Date().toISOString(),
      });

      onSubmit?.({ success: false });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="demo-form-container">
      <h3>Watch Product Demo</h3>
      <p>Fields marked as required must be completed</p>

      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <input type="text" name="firstname" placeholder="First Name *" required onChange={handleInputChange} />
          <input type="text" name="lastname" placeholder="Last Name" onChange={handleInputChange} />
        </div>
        <div className="form-row">
          <input type="email" name="emailid" placeholder="Company Email (Work) *" required onChange={handleInputChange} />
          <input type="tel" name="mobilenumber" placeholder="Phone * (10 digit mobile number)" maxLength="10" required onChange={handleInputChange} />
        </div>
        <input style={{width:"85%"}} type="text" name="username" placeholder="username@gmail.com *" required onChange={handleInputChange} />
        <h5>Select our solutions </h5>
        <select name="solutions" multiple className="multi-select" onChange={handleInputChange}>
          <option>Human resource management</option>
          <option>Compliance management system</option>
          <option>Transport management solution</option>
          <option>CRM - Customer Relationship Management</option>
          <option>Delivery Tracker(Mobile App)</option>
          <option>Order to Delivery(Mobile App)</option>
          <option>Production Management(Mobile App)</option>
          <option>Order a warehouse Management</option>
          <option>Compliance (Mobile App)</option>
          <option>Asset(Mobile App)</option>
          <option>Time sheet/Skill</option>
          <option>Inventory /Production/PO</option>
          <option>Invoice</option>
          <option>Token - Vehicle in/Out</option>

        </select>

        <textarea name="problem_statement" placeholder="Problem Statement" rows="5" onChange={handleInputChange}></textarea>


            
        <ReCAPTCHA
          ref={recaptchaRef}
          sitekey="6LeuhDIrAAAAAFswTXaV9MIjxAeQUssfcAgF8n3A"
          onChange={(token) => setCaptchaToken(token)}
        />

        <div className="form-actions">
          <button type="submit" className="submit" disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit"}
          </button>
          <button type="button" className="cancel" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default WatchProductDemoForm;
