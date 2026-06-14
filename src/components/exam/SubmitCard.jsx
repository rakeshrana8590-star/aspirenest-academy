export default function SubmitCard({ onSubmit }) {
    return (
      <div className="examFinalBox">
        <h4>Ready to submit?</h4>
  
        <p>Review your answers before final submission.</p>
  
        <button type="button" onClick={onSubmit}>
          Submit Test
        </button>
      </div>
    );
  }