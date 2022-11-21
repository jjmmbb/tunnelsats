import React from "react";
import { ToggleButtonGroup, ToggleButton } from "react-bootstrap";

// env variables to have the same code base main and dev
const REACT_APP_ONE_MONTH = process.env.REACT_APP_ONE_MONTH || 3.0;
const REACT_APP_THREE_MONTHS = process.env.REACT_APP_THREE_MONTHS || 8.5;
const REACT_APP_SIX_MONTHS = process.env.REACT_APP_SIX_MONTHS || 16.0;
const REACT_APP_ONE_YEAR = process.env.REACT_APP_ONE_YEAR || 28.5;

const RuntimeSelector = (props) => {
  return (
    <div className="runtimeselector">
      <ToggleButtonGroup
        type="radio"
        name="options"
        id="runtimeselector"
        defaultValue={REACT_APP_THREE_MONTHS}
      >
        <ToggleButton
          id="tbg-radio-1"
          value={REACT_APP_ONE_MONTH}
          onChange={props.onChange}
        >
          1 <br></br> month
        </ToggleButton>
        <ToggleButton
          id="tbg-radio-2"
          value={REACT_APP_THREE_MONTHS}
          onChange={props.onChange}
        >
          3 <br></br> months
        </ToggleButton>
        <ToggleButton
          id="tbg-radio-3"
          value={REACT_APP_SIX_MONTHS}
          onChange={props.onChange}
        >
          6 <br></br> months
        </ToggleButton>
        <ToggleButton
          id="tbg-radio-4"
          value={REACT_APP_ONE_YEAR}
          onChange={props.onChange}
        >
          12 <br></br> months
        </ToggleButton>
      </ToggleButtonGroup>
    </div>
  );
};

export default RuntimeSelector;
