import React, { useState } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';
import { toast } from 'react-toastify';
import emailjs from 'emailjs-com';

const ScheduleDiscussionForm = ({ onSubmit, onCancel, onAddBotMessage }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    firstname: '',
    lastname: '',
    email: '',
    phone: '',
    industry: '',
    product: '',
    preferredDate: '',
    hour: '09',
    minute: '00',
    period: 'AM',
    specificRequirements: ''
  });

  const [errors, setErrors] = useState({});
  const [captchaToken, setCaptchaToken] = useState(null);
  const recaptchaRef = React.createRef();

  const products = [
    'Human resource management',
    'Compliance management system',
    'Transport management solution',
    'CRM - Customer Relationship Management',
    'Delivery Tracker(Mobile App)',
    'Order to Delivery(Mobile App)',
    'Production Management(Mobile App)',
    'Order a warehouse Management',
    'Compliance (Mobile App)',
    'Asset(Mobile App)',
    'Time sheet/Skill',
    'Inventory /Production/PO',
    'Invoice',
    'Token - Vehicle in/Out'
  ];

  const validate = () => {
    const newErrors = {};
    if (!formData.firstname) newErrors.firstname = 'First name is required.';
    if (!formData.email) newErrors.email = 'Email is required.';
    if (!formData.phone || !/^\d{10}$/.test(formData.phone)) newErrors.phone = 'Valid 10-digit phone is required.';
    if (!formData.industry) newErrors.industry = 'Industry is required.';
    if (!formData.product) newErrors.product = 'Please select a product.';
    if (!formData.preferredDate) newErrors.preferredDate = 'Preferred date is required.';
    return newErrors;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const sendEmailToTeam = async () => {
    try {
      await emailjs.send(
        'service_9mhb3si',
        'template_ikmjzgs',
        {
          firstname: formData.firstname,
          lastname: formData.lastname,
          email: formData.email,
          phone: formData.phone,
          industry: formData.industry,
          product: formData.product,
          preferredDate: formData.preferredDate,
          time: `${formData.hour}:${formData.minute} ${formData.period}`,
          specificRequirements: formData.specificRequirements,
        },
        'H6UxJnaMT1ehQhQOu'
      );
    } catch (err) {
      console.error("Failed to send email:", err);
      throw err;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setIsSubmitting(false);
      return;
    }

    if (!captchaToken) {
      toast.error("Please complete the reCAPTCHA.", {
        position: "bottom-right",
      });
      setIsSubmitting(false);
      return;
    }

    // Prepare the data in the required format
    const submissionData = {
      firstname: formData.firstname,
      lastname: formData.lastname,
      email: formData.email,
      username: formData.email, // Using email as username
      problem_statement: "demo", // Hardcoded as per your example
      mobilenumber: formData.phone,
      industry: formData.industry,
      interested_product: formData.product,
      preferred_date: formData.preferredDate
    };

    try {
      // Send to your API
      const apiResponse = await fetch('https://demoapi.techgenzi.com/demo_user/discussion_user/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submissionData)
      });

      if (!apiResponse.ok) {
        throw new Error("API submission failed");
      }

      // Also send email notification
      await sendEmailToTeam();

      // Store in local storage
      localStorage.setItem('customerInfo', JSON.stringify(submissionData));

      // Show success messages
      const successMessage = `Thank you ${formData.firstname}, we received your request. Our team will connect with you at ${formData.email}.`;
      
      if (onAddBotMessage) {
        onAddBotMessage({
          from: 'bot',
          text: successMessage,
          timestamp: new Date().toISOString(),
        });
      }

      toast.success("Submission successful!", { position: "bottom-right" });
      
      if (onSubmit) {
        onSubmit({ success: true, data: submissionData });
      }

    } catch (err) {
      console.error(err);
      toast.error("Submission failed. Please try again later.", {
        position: "bottom-right",
      });

      if (onAddBotMessage) {
        onAddBotMessage({
          from: 'bot',
          text: `Oops! Something went wrong, ${formData.firstname}.`,
          timestamp: new Date().toISOString(),
        });
      }

      if (onSubmit) {
        onSubmit({ success: false });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="schedule-discussion-form">
      <h3>Schedule a Discussion</h3>
      <p>Fields marked as required must be completed</p>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <input 
            type="text" 
            name="firstname" 
            placeholder="First Name *" 
            value={formData.firstname} 
            onChange={handleInputChange} 
          />
          {errors.firstname && <span className="error">{errors.firstname}</span>}

          <input 
            type="text" 
            name="lastname" 
            placeholder="Last Name" 
            value={formData.lastname} 
            onChange={handleInputChange} 
          />
        </div>

        <div className="form-group">
          <input 
            type="email" 
            name="email" 
            placeholder="Company Email (Work) *" 
            value={formData.email} 
            onChange={handleInputChange} 
          />
          {errors.email && <span className="error">{errors.email}</span>}

          <input 
            type="tel" 
            name="phone" 
            placeholder="Phone * (10 digit mobile number)" 
            value={formData.phone} 
            onChange={handleInputChange} 
          />
          {errors.phone && <span className="error">{errors.phone}</span>}
        </div>

        <div className="form-group">
          <input 
            className='industry' 
            type="text" 
            name="industry" 
            placeholder="Industry *" 
            value={formData.industry} 
            onChange={handleInputChange} 
          />
          {errors.industry && <span className="error">{errors.industry}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="product">Which product are you interested in? *</label>
          <select 
            className="select" 
            name="product" 
            value={formData.product} 
            onChange={handleInputChange}
          >
            <option value="">Select a product</option>
            {products.map((product, index) => (
              <option key={index} value={product}>{product}</option>
            ))}
          </select>
          {errors.product && <span className="error">{errors.product}</span>}
        </div>

        <div className="form-group">
          <input 
            className='preferredDate' 
            type="date" 
            name="preferredDate" 
            placeholder="Preferred Date *" 
            value={formData.preferredDate} 
            onChange={handleInputChange} 
          />
          {errors.preferredDate && <span className="error">{errors.preferredDate}</span>}
          
          <div className="time-select">
            <select name="hour" value={formData.hour} onChange={handleInputChange}>
              {Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0')).map(hour => (
                <option key={hour} value={hour}>{hour}</option>
              ))}
            </select>
            <select name="minute" value={formData.minute} onChange={handleInputChange}>
              {['00', '15', '30', '45'].map(minute => (
                <option key={minute} value={minute}>{minute}</option>
              ))}
            </select>
            <select name="period" value={formData.period} onChange={handleInputChange}>
              <option value="AM">AM</option>
              <option value="PM">PM</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <textarea 
            name="specificRequirements" 
            className='specificRequirements' 
            placeholder="Are you looking for anything specific?" 
            value={formData.specificRequirements} 
            onChange={handleInputChange}
          ></textarea>
        </div>

        <div className="form-group">
          <ReCAPTCHA
            size='normal'
            ref={recaptchaRef}
            sitekey="6LeuhDIrAAAAAFswTXaV9MIjxAeQUssfcAgF8n3A"
            onChange={(token) => setCaptchaToken(token)}
          />
        </div>

        <div className="form-actions">
          <button
            type="submit"
            className="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </button>
          <button
            type="button"
            className="cancel"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default ScheduleDiscussionForm;