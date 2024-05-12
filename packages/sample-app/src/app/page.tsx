import { getWatchMediaList } from "./lib/actions";
import WatchMediaList from "./watchMediaList";

export default async function WatchMediaPage() {
  const watchMediaList = await getWatchMediaList();
  return <WatchMediaList watchMediaList={watchMediaList} />;
}
