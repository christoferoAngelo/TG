import {
    Label as AriaLabel,
    Slider as AriaSlider,
    SliderOutput as AriaSliderOutput,
    SliderThumb as AriaSliderThumb,
    SliderTrack as AriaSliderTrack
} from "react-aria-components";
import "./slider.css";

export function Slider({
    labelPosition = "bottom",
    minValue = 0,
    maxValue = 100,
    labelFormatter,
    formatOptions,
    "aria-label": ariaLabel = "Controle",
    ...rest
}) {
    const formatoPadrao = {
        maximumFractionDigits: 0
    };

    return (
        <AriaSlider
            {...rest}
            aria-label={ariaLabel}
            minValue={minValue}
            maxValue={maxValue}
            formatOptions={formatOptions ?? formatoPadrao}
            className="uu-slider"
        >
            <AriaLabel className="uu-slider__rotulo" />
            <AriaSliderTrack className="uu-slider__trilho">
                {({ state: { values, getThumbValue, getThumbPercent } }) => {
                    const esquerda = values.length === 1 ? 0 : getThumbPercent(0);
                    const largura = values.length === 1 ? getThumbPercent(0) : getThumbPercent(1) - esquerda;

                    return (
                        <>
                            <span className="uu-slider__fundo" />
                            <span
                                className="uu-slider__preenchido"
                                style={{
                                    left: `${esquerda * 100}%`,
                                    width: `${largura * 100}%`
                                }}
                            />
                            {values.map((_, index) => (
                                <AriaSliderThumb
                                    key={index}
                                    index={index}
                                    className={({ isFocusVisible, isDragging }) =>
                                        [
                                            "uu-slider__alca",
                                            isFocusVisible ? "uu-slider__alca--foco" : "",
                                            isDragging ? "uu-slider__alca--arraste" : ""
                                        ].filter(Boolean).join(" ")
                                    }
                                >
                                    <AriaSliderOutput className={`uu-slider__valor uu-slider__valor--${labelPosition}`}>
                                        {labelFormatter
                                            ? labelFormatter(getThumbValue(index))
                                            : getThumbValue(index)}
                                    </AriaSliderOutput>
                                </AriaSliderThumb>
                            ))}
                        </>
                    );
                }}
            </AriaSliderTrack>
        </AriaSlider>
    );
}
