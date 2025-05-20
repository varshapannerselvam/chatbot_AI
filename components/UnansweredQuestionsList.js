
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Modal, Input, message } from 'antd';

const UnansweredQuestionsList = () => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [answer, setAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUnansweredQuestions = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5000/unanswered-questions', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) throw new Error('Failed to fetch questions');
        const data = await response.json();
        setQuestions(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUnansweredQuestions();
  }, []);

  const handleAddAnswerClick = (question) => {
    setCurrentQuestion(question);
    setIsModalVisible(true);
  };

  // const handleSubmitAnswer = async () => {
  //   if (!answer.trim()) {
  //     message.error('Please enter an answer');
  //     return;
  //   }

  //   setIsSubmitting(true);
  //   try {
  //     const token = localStorage.getItem('token');
      
  //     // Optimistic UI update - remove immediately
  //     setQuestions(prev => prev.filter(q => q.id !== currentQuestion.id));

  //     // 1. Add to knowledge base
  //     const kbResponse = await fetch('http://localhost:5000/add-to-knowledge-base', {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //         'Authorization': `Bearer ${token}`
  //       },
  //       body: JSON.stringify({
  //         question: currentQuestion.question,
  //         answer: answer
  //       })
  //     });

  //     if (!kbResponse.ok) {
  //       // Re-add if failed
  //       setQuestions(prev => [...prev, currentQuestion]);
  //       throw new Error('Failed to add to knowledge base');
  //     }

  //     // 2. Remove from unanswered
  //     const removeResponse = await fetch(
  //       `http://localhost:5000/unanswered-questions/${currentQuestion.id}`, 
  //       {
  //         method: 'DELETE',
  //         headers: {
  //           'Authorization': `Bearer ${token}`
  //         }
  //       }
  //     );

  //     if (!removeResponse.ok) {
  //       // Re-add if failed
  //       setQuestions(prev => [...prev, currentQuestion]);
  //       throw new Error('Failed to remove question');
  //     }

  //     message.success('Answer added successfully!');
  //     setIsModalVisible(false);
  //     setAnswer('');
  //   } catch (error) {
  //     message.error(error.message);
  //   } finally {
  //     setIsSubmitting(false);
  //   }
  // };

const handleSubmitAnswer = async () => {
  if (!answer.trim()) {
    message.error('Please enter an answer');
    return;
  }
   setIsModalVisible(false); // ✅ Close modal immediately
  setIsSubmitting(true);
  const originalQuestions = [...questions];

  try {
    const token = localStorage.getItem('token');

    // Optimistic UI update
    setQuestions(prev => prev.filter(q => q.id !== currentQuestion.id));

    // Parallel API calls
    const [kbResponse, removeResponse] = await Promise.all([
      fetch('http://localhost:5000/add-to-knowledge-base', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          question: currentQuestion.question,
          answer: answer
        })
      }),
      fetch(`http://localhost:5000/unanswered-questions/${currentQuestion.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
    ]);

    if (!kbResponse.ok || !removeResponse.ok) {
      throw new Error(!kbResponse.ok 
        ? 'Failed to add to knowledge base' 
        : 'Failed to remove question'
      );
    }

    message.success('Answer added successfully!');
    // setIsModalVisible(false); // ✅ Close modal on success
    setAnswer('');
  } catch (error) {
    message.error(error.message || 'An error occurred.');
    setQuestions(originalQuestions); // Rollback UI
  } finally {
    setIsSubmitting(false);
  }
};


  if (loading) return <div className="loading">Loading questions...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="unanswered-questions-container">
      <h2>Unanswered Questions</h2>
      
      <Modal
        title={`Answer Question #${currentQuestion?.id}`}
        visible={isModalVisible}
        onOk={handleSubmitAnswer}
        onCancel={() => setIsModalVisible(false)}
        okText="Submit Answer"
        confirmLoading={isSubmitting}
        okButtonProps={{ disabled: isSubmitting }}
      >
        <p><strong>Question:</strong> {currentQuestion?.question}</p>
        <Input.TextArea
          rows={4}
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Enter your answer here..."
          disabled={isSubmitting}
        />
      </Modal>

      {questions.length === 0 ? (
        <Card style={{ textAlign: 'center' }}>
          <p>No unanswered questions found.</p>
        </Card>
      ) : (
        <div className="questions-grid">
          {questions.map((q) => (
            <Card
              key={q.id}
              title={`Question #${q.id}`}
              style={{ marginBottom: '16px' }}
              actions={[
                <Button 
                  type="primary" 
                  onClick={() => handleAddAnswerClick(q)}
                  disabled={isSubmitting}
                  loading={isSubmitting && currentQuestion?.id === q.id}
                >
                  Add Answer
                </Button>
              ]}
            >
              <div className="question-content">
                <p><strong>Question:</strong> {q.question}</p>
                <p><strong>Asked on:</strong> {new Date(q.timestamp).toLocaleString()}</p>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default UnansweredQuestionsList;

