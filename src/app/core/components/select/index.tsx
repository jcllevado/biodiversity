// Import dependencies
import { FC, MouseEvent, ChangeEvent, FocusEvent, useState, Fragment, useEffect } from "react";
import classNames from "classnames";

type TOptions = {
    value: string | number;
    text: string;
    disabled?: boolean;
};

// Define the props type for the Select component
type TSelectProps = {
    options?: TOptions[];
    value?: string | number | null;
    placeholder?: string;
    nullable?: boolean;
    name?: string;
    id?: string;
    required?: boolean;
    readOnly?: boolean;
    className?: string;
    variant?: "primary" | "secondary" | "danger" | "default";
    size?: "xs" | "sm" | "md" | "lg";
    disabled?: boolean;
    error?: boolean;
    errorText?: string;
    errorIcon?: boolean;
    onClick?: (e: MouseEvent<HTMLSelectElement>) => void;
    onChange?: (e: ChangeEvent<HTMLSelectElement>) => void;
    onBlur?: (e: FocusEvent<HTMLSelectElement>) => void;
};

/**
 * Select component props.
 * @params options Array of string options for the select element
 * @params value Currently selected value
 * @params placeholder Placeholder text when no option is selected
 * @params name Name attribute for the select element
 * @params id ID attribute for the select element
 * @params required Indicates if the select is required
 * @params readOnly Indicates if the select is read-only
 * @params className Additional CSS classes for custom styling
 * @params variant Variant styles for the select element
 * @params size Size variations for the select element
 * @params disabled Indicates if the select is disabled
 * @params error Indicates if there's an error with the select
 * @params errorText Error message to display when error is true
 * @params errorIcon Indicates if an error icon should be displayed
 * @params onClick Click event handler for the select element
 * @params onChange Change event handler for the select element
 */
const Select: FC<TSelectProps> = ({
    options = [],
    value = "",
    placeholder = "Choose from options",
    name,
    id,
    required = false,
    readOnly = false,
    className = "",
    variant = "primary",
    size = "md",
    disabled = false,
    error = false,
    errorText,
    onChange = () => { },
    onClick = () => { },
    onBlur = () => { },
}) => {

    const [selected, setSelected] = useState<string | number>(value ?? "");
    // Generate the CSS classes for the select element based on props
    const selectClass = classNames(
        "select w-full border border-gray-300 rounded-lg",
        `select-${variant}`,
        `select-${size}`,
        "select-bordered",
        { "select-error": error },
        className,
    );

    const handleChange = (e: ChangeEvent<HTMLSelectElement>) => {
        onChange(e);
        setSelected(e.target.value);
    };

    useEffect(() => {
        setSelected(value ?? "");
    }, [value])

    return (
        <Fragment>
            <select
                name={name}
                id={id}
                value={selected ?? ""}
                onChange={handleChange}
                className={selectClass}
                onClick={onClick}
                onBlur={onBlur}
                disabled={disabled || readOnly}
                required={required}
            >
                {/* Default disabled placeholder option */}
                <option disabled={required} value="">
                    {placeholder}
                </option>
                {/* Maps through options array to generate option elements */}
                {options.map((opt, index) => {
                    return (
                        <option key={`opt-${index}`} value={opt.value ?? opt} disabled={opt?.disabled}>
                            {opt.text ?? opt}
                        </option>
                    );
                })}
            </select>
            {/* Displays error message if error prop is true */}
            {error && <span className="text-xs pl-2 text-red-500">{errorText}</span>}
        </Fragment>
    );
};

// Exporting Select component as default
export default Select;
