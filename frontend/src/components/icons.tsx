import type { CustomIconComponentProps } from '@ant-design/icons/lib/components/Icon';
import Icon from '@ant-design/icons';

export const ChatIconAI = (props: Partial<CustomIconComponentProps>) =>{
    const AISvg = ()=>(
        <svg
            width="100"
            height="100"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <circle cx="12" cy="12" r="12" fill="#F2C94C" />
            <path
                d="M8 9.33344H16C17.1046 9.33344 18 10.2288 18 11.3334V15.3334C18 16.438 17.1046 17.3334 16 17.3334H14.6667L12 20L9.33333 17.3334H8C6.89543 17.3334 6 16.438 6 15.3334V11.3334C6 10.2288 6.89543 9.33344 8 9.33344Z"
                fill="white"
            />
        </svg>
    )
    return (
        <Icon
            component={AISvg}
            {...props}
        />
    )
}
