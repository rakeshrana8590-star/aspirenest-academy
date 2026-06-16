export default function SubmitCard({ onSubmit }) {
  return (
    <div className="examSubmitCard">
      <h4>Ready to submit?</h4>

      <p>
        Review your answers before final submission. Once submitted, this
        attempt will be locked.
      </p>

      <button
        type="button"
        className="examSubmitCardBtn"
        onClick={onSubmit}
      >
        Submit Test
      </button>
    </div>
  );
}