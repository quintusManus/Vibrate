interface Props {
  day: number;
  subscribed: boolean;
}

export default function TrialBanner({ day, subscribed }: Props) {
  if (subscribed) {
    return <span className="bg-green-700 px-2 py-1 rounded">Subscribed</span>;
  }
  return (
    <div className="bg-yellow-600 px-2 py-1 rounded">
      Day {day} of 7-day free trial
    </div>
  );
}
