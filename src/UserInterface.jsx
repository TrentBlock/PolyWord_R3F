function UserInterface({ setShowInstructions }) {
  return (
    <div className="ui-controls-container">
      <button className="modern-btn highlight-btn" onClick={() => setShowInstructions(true)}>
        Instructions
      </button>
    </div>
  )
}

export default UserInterface